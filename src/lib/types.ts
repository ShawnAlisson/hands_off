export type SkillName = "research" | "sales" | "operations" | "strategy" | "execution";

export type AgentRole =
  | "Research Lead"
  | "Sales Lead"
  | "Operations Lead"
  | "Strategist"
  | "Delivery Engineer";

export type DealPhase =
  | "discovered"
  | "researched"
  | "outreach"
  | "awaiting_owner"
  | "responded"
  | "paid"
  | "building"
  | "delivered"
  | "lost";

export type OpportunityStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "failed";

export interface Skills {
  research: number;
  sales: number;
  operations: number;
  strategy: number;
  execution: number;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  budget: number;
  reputation: number;
  role: AgentRole;
  skills: Skills;
  memory: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  businessName: string;
  problem: string;
  city: string;
  sector: string;
  value: number;
  difficulty: "Low" | "Medium" | "High";
  status: OpportunityStatus;
  discoveredAt: string;
}

export interface Deal {
  id: string;
  opportunityId: string;
  businessName: string;
  city: string;
  sector: string;
  problem: string;
  solution: string;
  phase: DealPhase;
  value: number;
  outreachMessage?: string;
  ownerResponse?: string;
  paymentRef?: string;
  liveUrl?: string;
  previewSlug?: string;
  siteFixed?: boolean;
  ownerAcceptedAt?: string;
  chatLog?: { role: "owner" | "agent"; text: string; at: string }[];
  buildSummary?: string;
  researchLeadId: string;
  salesLeadId: string;
  opsLeadId: string;
  startedAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  opportunityId: string;
  dealId: string;
  leadAgentId: string;
  teamAgentIds: string[];
  status: "executing" | "completed" | "failed";
  deliverables: {
    strategy: string;
    landingPage: string;
    salesPitch: string;
  };
  executionScore: number;
  revenue: number;
  manusEnhanced?: boolean;
  manusTaskId?: string;
  createdAt?: string;
}

export type EventType =
  | "company_started"
  | "lead_discovered"
  | "problem_analyzed"
  | "solution_proposed"
  | "outreach_sent"
  | "owner_responded"
  | "payment_received"
  | "build_started"
  | "build_shipped"
  | "deal_won"
  | "deal_lost"
  | "revenue_earned";

export interface CivilizationEvent {
  id: string;
  timestamp: string;
  type: EventType;
  title: string;
  body: string;
  phase?: DealPhase;
  dealId?: string;
  businessName?: string;
  agentName?: string;
  agentTitle?: string;
  meta?: Record<string, string>;
  agentIds?: string[];
}

export interface CivilizationState {
  running: boolean;
  tick: number;
  companyBudget: number;
  totalRevenue: number;
  agents: Agent[];
  opportunities: Opportunity[];
  activeDeal: Deal | null;
  deals: Deal[];
  projects: Project[];
  events: CivilizationEvent[];
  revenueHistory: { tick: number; revenue: number; at: string }[];
  lastTickAt: string | null;
}

export interface SystemStatus {
  manus: boolean;
  supabase: boolean;
  supabaseConnected?: boolean;
  supabaseError?: string | null;
  supabaseRealtime: boolean;
}

// Legacy — kept for storage migration
export interface Proposal {
  id: string;
  agentId: string;
  opportunityId: string;
  bidCost: number;
  needsTeam: boolean;
  teammates: string[];
  pitch: string;
  score: number;
  manusEnhanced?: boolean;
  createdAt: string;
}
