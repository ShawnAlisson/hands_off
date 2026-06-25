import type { Deal } from "./types";
import { manusChat } from "./manus";

function pickFallbackReply(deal: Deal, msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("price") || m.includes("cost") || m.includes("how much")) {
    return `It's £${deal.value} all-in — we ship a working fix, not a slide deck. Pay securely with PayPal below once you're happy.`;
  }
  if (m.includes("long") || m.includes("time") || m.includes("when")) {
    return `We typically go live within 14 days. For ${deal.businessName}: ${deal.solution.slice(0, 140)}`;
  }
  if (m.includes("example") || m.includes("see") || m.includes("demo") || m.includes("website")) {
    return `The preview on the left is your site today — notice what's missing (${deal.problem.toLowerCase()}). After payment, Manus AI + our engineer Sam rebuild that section automatically.`;
  }
  return `We spotted "${deal.problem}" at ${deal.businessName}. Our fix: ${deal.solution.slice(0, 120)}… Ask me anything, then accept with PayPal when ready.`;
}

export async function replyAsSalesAgent(
  deal: Deal,
  ownerMessage: string,
  agentName: string
): Promise<{ reply: string; manus: boolean }> {
  const system = `You are ${agentName}, Sales Director at Hands Off (AI company).
Business: ${deal.businessName} (${deal.city}, ${deal.sector})
Problem: ${deal.problem}
Solution: ${deal.solution}
Price: £${deal.value} GBP
You are on the private offer page. Owner can pay via PayPal sandbox.`;

  const history = deal.chatLog ?? [];
  const { reply, enhanced } = await manusChat(system, ownerMessage, history);

  if (enhanced && reply.length > 10) {
    return { reply, manus: true };
  }

  return { reply: pickFallbackReply(deal, ownerMessage), manus: false };
}
