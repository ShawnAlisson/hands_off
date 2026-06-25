/** Sponsor attribution per pipeline step — for demo & judges */
export const STEP_SPONSORS: Record<string, { sponsor: string; tech: string }> = {
  company_started: { sponsor: "Cursor", tech: "Next.js app + autonomous loop" },
  lead_discovered: { sponsor: "Cursor", tech: "UK business dataset scanner" },
  problem_analyzed: { sponsor: "Supabase", tech: "Deal state persisted to cloud" },
  solution_proposed: { sponsor: "Manus AI", tech: "LLM solution design (structured output)" },
  outreach_sent: { sponsor: "Wassist + Manus", tech: "WhatsApp outreach + AI-written pitch" },
  owner_responded: { sponsor: "Manus AI", tech: "Owner chat on offer portal" },
  payment_received: { sponsor: "PayPal", tech: "Sandbox checkout capture" },
  revenue_earned: { sponsor: "PayPal + Supabase", tech: "Payment recorded to company ledger" },
  build_started: { sponsor: "Manus AI", tech: "AI generates fixed website content" },
  build_shipped: { sponsor: "Manus AI", tech: "Live site preview updated with AI copy" },
  deal_won: { sponsor: "Hands Off", tech: "Full autonomous company loop" },
};

export function sponsorMeta(type: string): Record<string, string> {
  const s = STEP_SPONSORS[type];
  if (!s) return {};
  return { sponsor: s.sponsor, poweredBy: s.tech };
}
