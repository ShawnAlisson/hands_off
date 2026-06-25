const MANUS_BASE = "https://api.manus.ai";

export function isManusEnabled(): boolean {
  return !!process.env.MANUS_API_KEY;
}

interface ManusResponse<T = unknown> {
  ok: boolean;
  request_id?: string;
  error?: { code: string; message: string };
  task_id?: string;
  data?: T;
}

interface ManusMessage {
  type?: string;
  event_type?: string;
  agent_status?: string;
  content?: string | { text?: string };
  structured_output_result?: Record<string, unknown>;
}

function manusHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-manus-api-key": process.env.MANUS_API_KEY!,
  };
}

async function manusFetch<T>(path: string, init?: RequestInit): Promise<ManusResponse<T>> {
  const res = await fetch(`${MANUS_BASE}${path}`, {
    ...init,
    headers: { ...manusHeaders(), ...init?.headers },
  });
  return res.json();
}

export async function createManusTask(
  prompt: string,
  structuredOutputSchema?: Record<string, unknown>
): Promise<string | null> {
  if (!isManusEnabled()) return null;

  const body: Record<string, unknown> = {
    message: { content: prompt },
  };
  if (structuredOutputSchema) {
    body.structured_output_schema = structuredOutputSchema;
  }

  const result = await manusFetch<{ task_id: string }>("/v2/task.create", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    console.error("[Manus] task.create failed:", result.error?.message);
    return null;
  }

  const taskId =
    result.task_id ??
    (result as { task_id?: string }).task_id ??
    (result.data as { task_id?: string } | undefined)?.task_id;

  return taskId ?? null;
}

function extractTextFromMessage(msg: ManusMessage): string | null {
  if (msg.structured_output_result) {
    const values = Object.values(msg.structured_output_result).filter(
      (v) => typeof v === "string"
    ) as string[];
    if (values.length > 0) return values.join(" ");
  }
  if (typeof msg.content === "string") return msg.content.trim();
  if (msg.content && typeof msg.content === "object" && "text" in msg.content) {
    return msg.content.text?.trim() ?? null;
  }
  return null;
}

export async function pollManusTask<T extends Record<string, unknown> = Record<string, unknown>>(
  taskId: string,
  maxWaitMs = 20000
): Promise<{ text?: string; structured?: T; taskId: string } | null> {
  const start = Date.now();
  let lastStatus = "running";

  while (Date.now() - start < maxWaitMs) {
    const result = await manusFetch<{ messages: ManusMessage[] }>(
      `/v2/task.listMessages?task_id=${encodeURIComponent(taskId)}&limit=50&order=desc`
    );

    if (!result.ok) {
      console.error("[Manus] listMessages failed:", result.error?.message);
      return null;
    }

    const raw = result as unknown as Record<string, unknown>;
    const messages =
      (result.data as { messages?: ManusMessage[] } | undefined)?.messages ??
      (raw.messages as ManusMessage[] | undefined) ??
      [];

    for (const msg of messages) {
      const eventType = msg.type ?? msg.event_type ?? "";

      if (eventType === "structured_output_result" && msg.structured_output_result) {
        return { structured: msg.structured_output_result as T, taskId };
      }

      if (eventType === "assistant_message") {
        const text = extractTextFromMessage(msg);
        if (text) return { text, taskId };
      }

      if (eventType === "status_update") {
        lastStatus = msg.agent_status ?? lastStatus;
        if (lastStatus === "error") {
          console.error("[Manus] task error");
          return null;
        }
        if (lastStatus === "stopped") {
          // Check all messages for structured output or assistant text
          for (const m of messages) {
            if (m.structured_output_result) {
              return { structured: m.structured_output_result as T, taskId };
            }
            const t = extractTextFromMessage(m);
            if (t && (m.type === "assistant_message" || m.event_type === "assistant_message")) {
              return { text: t, taskId };
            }
          }
          return { taskId };
        }
      }
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.warn("[Manus] poll timeout for task", taskId);
  return null;
}

export async function manusGeneratePitch(
  agentName: string,
  skills: { research: number; sales: number },
  opportunityTitle: string,
  value: number,
  fallback: string
): Promise<{ pitch: string; enhanced: boolean; taskId?: string }> {
  if (!isManusEnabled()) return { pitch: fallback, enhanced: false };

  const prompt = `You are ${agentName}, an AI agent in a self-organizing company competing for work.

Opportunity: ${opportunityTitle}
Value: £${value}
Your skills — research: ${skills.research.toFixed(1)}, sales: ${skills.sales.toFixed(1)}

Write ONE confident competitive bid pitch (max 2 sentences). No preamble.`;

  const schema = {
    type: "object",
    properties: {
      pitch: { type: "string", description: "The competitive bid pitch" },
    },
    required: ["pitch"],
  };

  try {
    const taskId = await createManusTask(prompt, schema);
    if (!taskId) return { pitch: fallback, enhanced: false };

    const result = await pollManusTask<{ pitch?: string }>(taskId, 12000);
    const pitch = result?.structured?.pitch ?? result?.text ?? fallback;
    return { pitch, enhanced: true, taskId };
  } catch (err) {
    console.error("[Manus] pitch generation failed:", err);
    return { pitch: fallback, enhanced: false };
  }
}

export interface DeliverablesOutput {
  strategy: string;
  landingPage: string;
  salesPitch: string;
}

export async function manusGenerateDeliverables(
  businessName: string,
  problem: string,
  value: number,
  leadAgent: string,
  teamSize: number,
  fallback: DeliverablesOutput
): Promise<{ deliverables: DeliverablesOutput; enhanced: boolean; taskId?: string }> {
  if (!isManusEnabled()) return { deliverables: fallback, enhanced: false };

  const prompt = `You are an AI company execution team led by ${leadAgent} (${teamSize} agents).

Client: ${businessName}
Problem: ${problem}
Contract value: £${value}

Generate deliverables for this UK small business opportunity. Be specific and actionable.`;

  const schema = {
    type: "object",
    properties: {
      strategy: { type: "string", description: "3-phase execution strategy" },
      landingPage: { type: "string", description: "Landing page copy outline with hero, CTA, social proof" },
      salesPitch: { type: "string", description: "Outreach email/message to the business owner" },
    },
    required: ["strategy", "landingPage", "salesPitch"],
  };

  try {
    const taskId = await createManusTask(prompt, schema);
    if (!taskId) return { deliverables: fallback, enhanced: false };

    const result = await pollManusTask<Record<string, unknown>>(taskId, 25000);
    if (result?.structured && typeof result.structured.strategy === "string") {
      return {
        deliverables: result.structured as unknown as DeliverablesOutput,
        enhanced: true,
        taskId,
      };
    }
    return { deliverables: fallback, enhanced: false, taskId };
  } catch (err) {
    console.error("[Manus] deliverables generation failed:", err);
    return { deliverables: fallback, enhanced: false };
  }
}
