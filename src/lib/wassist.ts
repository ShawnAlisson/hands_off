const WASSIST_BASE = "https://backend.wassist.app/api/v1";

export function isWassistConfigured(): boolean {
  return !!process.env.WASSIST_API_KEY;
}

interface WassistFetchResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}

async function wassistFetch(path: string, init?: RequestInit): Promise<WassistFetchResult> {
  const res = await fetch(`${WASSIST_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.WASSIST_API_KEY!,
      ...init?.headers,
    },
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return { ok: res.ok, status: res.status, data: { raw: text } };
  }
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s()-]/g, "");
  if (cleaned.startsWith("0")) return `+44${cleaned.slice(1)}`;
  if (cleaned.startsWith("44") && !cleaned.startsWith("+")) return `+${cleaned}`;
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export async function listWassistAgents(): Promise<
  { id: string; name: string; whatsappNumber?: string }[]
> {
  if (!isWassistConfigured()) return [];
  const result = await wassistFetch("/agents/");
  if (!result.ok) {
    console.error("[Wassist] list agents failed:", result.status, result.data);
    return [];
  }
  const list = (result.data.results ?? result.data) as unknown;
  if (!Array.isArray(list)) return [];
  return list.map((a: Record<string, unknown>) => ({
    id: String(a.id),
    name: String(a.name ?? "Agent"),
    whatsappNumber:
      (a.whatsappNumber as string | undefined) ??
      (a.phoneNumber as string | undefined) ??
      ((a.whatsapp as Record<string, unknown> | undefined)?.number as string | undefined),
  }));
}

export async function getWassistAgent(agentId: string): Promise<Record<string, unknown> | null> {
  const result = await wassistFetch(`/agents/${agentId}/`);
  return result.ok ? result.data : null;
}

export async function checkWassistConnection(): Promise<{
  ok: boolean;
  agentCount: number;
  error?: string;
}> {
  if (!isWassistConfigured()) {
    return { ok: false, agentCount: 0, error: "WASSIST_API_KEY not set" };
  }
  try {
    const agents = await listWassistAgents();
    if (agents.length === 0) {
      return { ok: false, agentCount: 0, error: "API key set but no agents found — create one at wassist.app" };
    }
    return { ok: true, agentCount: agents.length };
  } catch (err) {
    return { ok: false, agentCount: 0, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function resolveAgent(): Promise<{ id: string; whatsappNumber?: string } | null> {
  if (process.env.WASSIST_AGENT_ID) {
    const detail = await getWassistAgent(process.env.WASSIST_AGENT_ID);
    if (detail) {
      return {
        id: process.env.WASSIST_AGENT_ID,
        whatsappNumber:
          (detail.whatsappNumber as string | undefined) ??
          (detail.phoneNumber as string | undefined) ??
          ((detail.whatsapp as Record<string, unknown> | undefined)?.number as string | undefined),
      };
    }
  }
  const agents = await listWassistAgents();
  return agents[0] ?? null;
}

async function findConversation(agentId: string, phone: string): Promise<string | null> {
  const result = await wassistFetch(`/conversations/?botId=${encodeURIComponent(agentId)}&limit=50`);
  if (!result.ok) return null;
  const list = (result.data.results ?? result.data) as unknown;
  if (!Array.isArray(list)) return null;
  const normalized = normalizePhone(phone);
  for (const conv of list as Record<string, unknown>[]) {
    const num =
      (conv.number as string | undefined) ??
      ((conv.contact as Record<string, unknown> | undefined)?.phoneNumber as string | undefined);
    if (num && normalizePhone(num) === normalized) {
      return String(conv.id);
    }
  }
  return null;
}

async function createConversation(
  agentId: string,
  toNumber: string,
  fromNumber?: string
): Promise<{ id: string | null; error?: string }> {
  const body: Record<string, string> = { agentId, toNumber };
  if (fromNumber) body.fromNumber = fromNumber;

  const result = await wassistFetch("/conversations/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    const errMsg =
      (result.data.detail as string) ??
      (result.data.error as string) ??
      JSON.stringify(result.data).slice(0, 200);
    console.error("[Wassist] create conversation failed:", result.status, errMsg);
    return { id: null, error: `${result.status}: ${errMsg}` };
  }

  return { id: String(result.data.id ?? "") || null };
}

async function sendConversationMessage(
  conversationId: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await wassistFetch(`/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

  if (result.ok) return { ok: true };

  const errMsg =
    (result.data.detail as string) ??
    (result.data.error as string) ??
    JSON.stringify(result.data).slice(0, 200);
  console.error("[Wassist] send message failed:", result.status, errMsg);
  return { ok: false, error: `${result.status}: ${errMsg}` };
}

async function triggerAgentMessage(
  conversationId: string,
  prompt: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await wassistFetch(`/conversations/${conversationId}/prompt/`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  if (result.ok || result.status === 204) return { ok: true };

  const errMsg = JSON.stringify(result.data).slice(0, 200);
  console.error("[Wassist] trigger failed:", result.status, errMsg);
  return { ok: false, error: `${result.status}: ${errMsg}` };
}

async function sendTemplateMessage(
  conversationId: string,
  templateName: string,
  bodyVars: string[]
): Promise<{ ok: boolean; error?: string }> {
  const result = await wassistFetch(`/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: JSON.stringify({
      type: "template",
      template: {
        name: templateName,
        variables: { body: bodyVars },
      },
    }),
  });

  if (result.ok) return { ok: true };
  return { ok: false, error: JSON.stringify(result.data).slice(0, 200) };
}

/** Send outreach via Wassist WhatsApp. */
export async function sendWassistOutreach(opts: {
  businessName: string;
  message: string;
  offerUrl: string;
}): Promise<{ sent: boolean; mode: "whatsapp" | "demo"; detail?: string; connectUrl?: string }> {
  if (!isWassistConfigured()) {
    return { sent: false, mode: "demo", detail: "WASSIST_API_KEY not set" };
  }

  const phone = process.env.WASSIST_DEMO_PHONE;
  if (!phone) {
    const check = await checkWassistConnection();
    return {
      sent: check.ok,
      mode: "demo",
      detail: check.ok
        ? `Wassist connected (${check.agentCount} agent). Set WASSIST_DEMO_PHONE=+44... to receive WhatsApp.`
        : check.error,
      connectUrl: "https://wassist.app",
    };
  }

  const agent = await resolveAgent();
  if (!agent?.id) {
    return { sent: false, mode: "demo", detail: "No Wassist agent found — create one at wassist.app" };
  }

  const toNumber = normalizePhone(phone);
  const fullMessage = `${opts.message}\n\n👉 View your offer: ${opts.offerUrl}`;

  let conversationId = await findConversation(agent.id, toNumber);

  if (!conversationId) {
    const created = await createConversation(agent.id, toNumber, agent.whatsappNumber);
    if (!created.id) {
      return {
        sent: false,
        mode: "demo",
        detail: `Could not create conversation: ${created.error ?? "unknown"}. Is the agent deployed to WhatsApp?`,
      };
    }
    conversationId = created.id;
  }

  // 1) Try direct text message (works inside 24h window or active chat)
  const sent = await sendConversationMessage(conversationId, fullMessage);
  if (sent.ok) {
    return {
      sent: true,
      mode: "whatsapp",
      detail: `Message sent to ${toNumber} via Wassist`,
      connectUrl: "https://wassist.app",
    };
  }

  // 2) Try agent trigger (proactive outreach — agent composes & sends)
  const triggered = await triggerAgentMessage(
    conversationId,
    `Send this exact outreach message to the business owner. Do not change the offer link:\n\n${fullMessage}`
  );
  if (triggered.ok) {
    return {
      sent: true,
      mode: "whatsapp",
      detail: `Agent triggered on ${toNumber} — check WhatsApp shortly`,
      connectUrl: "https://wassist.app",
    };
  }

  // 3) Try approved template if configured (required for cold WhatsApp outreach)
  const templateName = process.env.WASSIST_TEMPLATE_NAME;
  if (templateName) {
    const shortMsg = opts.message.slice(0, 200);
    const templated = await sendTemplateMessage(conversationId, templateName, [
      opts.businessName,
      shortMsg,
      opts.offerUrl,
    ]);
    if (templated.ok) {
      return {
        sent: true,
        mode: "whatsapp",
        detail: `Template "${templateName}" sent to ${toNumber}`,
        connectUrl: "https://wassist.app",
      };
    }
    return {
      sent: false,
      mode: "demo",
      detail: `All send methods failed. Template: ${templated.error}. Direct: ${sent.error}. Trigger: ${triggered.error}`,
    };
  }

  return {
    sent: false,
    mode: "demo",
    detail: `WhatsApp send failed (${sent.error}). For cold outreach, approve a template in WhatsApp Business Manager and set WASSIST_TEMPLATE_NAME in .env. Trigger also failed: ${triggered.error}`,
    connectUrl: "https://wassist.app",
  };
}
