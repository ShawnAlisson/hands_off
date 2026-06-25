import type { Deal } from "./types";
import { manusGeneratePitch } from "./manus";

export interface ChatMessage {
  role: "owner" | "agent";
  text: string;
  at: string;
}

export async function replyAsSalesAgent(
  deal: Deal,
  ownerMessage: string,
  agentName: string
): Promise<string> {
  const history = (deal.chatLog ?? [])
    .slice(-6)
    .map((m) => `${m.role === "owner" ? "Owner" : agentName}: ${m.text}`)
    .join("\n");

  const fallback = pickFallbackReply(deal, ownerMessage);

  if (!process.env.MANUS_API_KEY) return fallback;

  try {
    const prompt = `You are ${agentName}, Sales Director at Hands Off AI company. You're chatting with the owner of ${deal.businessName}.

Their problem: ${deal.problem}
Your proposed solution: ${deal.solution}
Price: £${deal.value}

Conversation so far:
${history}
Owner: ${ownerMessage}

Reply in 2-3 sentences. Be helpful, professional, UK tone. If they ask about price/timeline, answer directly. Encourage them to accept the offer on this page.`;

    const result = await manusGeneratePitch(agentName, { research: 2, sales: 4 }, prompt, deal.value, fallback);
    return result.pitch;
  } catch {
    return fallback;
  }
}

function pickFallbackReply(deal: Deal, msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("price") || m.includes("cost") || m.includes("how much")) {
    return `It's £${deal.value} all-in — we ship a working fix, not a slide deck. You can pay securely on this page once you're happy.`;
  }
  if (m.includes("long") || m.includes("time") || m.includes("when")) {
    return `We typically go live within 14 days. For ${deal.businessName}, we'd start with: ${deal.solution.slice(0, 120)}…`;
  }
  if (m.includes("example") || m.includes("see") || m.includes("demo")) {
    return `Check the website preview on the left — that's your site today. After payment, our engineer Sam ships the missing piece (e.g. ${deal.problem.toLowerCase()}).`;
  }
  return `Happy to help. We spotted "${deal.problem}" and our fix is: ${deal.solution.slice(0, 100)}… Ready when you are — hit Accept & Pay below.`;
}
