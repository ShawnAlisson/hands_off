const WASSIST_BASE = "https://backend.wassist.app/api/v1";

export function isWassistConfigured(): boolean {
  return !!process.env.WASSIST_API_KEY;
}

async function wassistFetch(path: string, init?: RequestInit) {
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
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: { raw: text } };
  }
}

export async function listWassistAgents(): Promise<{ id: string; name: string }[]> {
  if (!isWassistConfigured()) return [];
  const result = await wassistFetch("/agents/");
  if (!result.ok) return [];
  const list = result.data?.results ?? result.data ?? [];
  return Array.isArray(list)
    ? list.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))
    : [];
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

async function resolveAgentId(): Promise<string | null> {
  if (process.env.WASSIST_AGENT_ID) return process.env.WASSIST_AGENT_ID;
  const agents = await listWassistAgents();
  return agents[0]?.id ?? null;
}

/** Send outreach via Wassist WhatsApp (or verify API + demo link if no phone configured). */
export async function sendWassistOutreach(opts: {
  businessName: string;
  message: string;
  offerUrl: string;
}): Promise<{ sent: boolean; mode: "whatsapp" | "demo"; detail?: string; connectUrl?: string }> {
  if (!isWassistConfigured()) {
    return { sent: false, mode: "demo", detail: "WASSIST_API_KEY not set" };
  }

  const phone = process.env.WASSIST_DEMO_PHONE;
  const agentId = await resolveAgentId();

  if (agentId && phone) {
    const body: Record<string, string> = {
      agentId,
      toNumber: phone,
    };

    const result = await wassistFetch("/conversations/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (result.ok) {
      const convId = result.data?.id;
      if (convId) {
        await wassistFetch(`/conversations/${convId}/prompt/`, {
          method: "POST",
          body: JSON.stringify({
            prompt: `Send this outreach to the business owner for ${opts.businessName}:\n\n${opts.message}\n\nOffer link: ${opts.offerUrl}`,
          }),
        });
      }
      return {
        sent: true,
        mode: "whatsapp",
        detail: `WhatsApp conversation ${convId ?? "created"} via Wassist`,
        connectUrl: "https://wassist.app",
      };
    }

    return {
      sent: false,
      mode: "demo",
      detail: `Wassist conversation failed (${result.status}) — check agent deploy + phone number`,
    };
  }

  const check = await checkWassistConnection();
  return {
    sent: check.ok,
    mode: "demo",
    detail: check.ok
      ? `Wassist connected (${check.agentCount} agent(s)). Add WASSIST_DEMO_PHONE for live WhatsApp.`
      : check.error,
    connectUrl: "https://wassist.app",
  };
}
