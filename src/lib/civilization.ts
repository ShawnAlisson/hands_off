import businesses from "@/data/uk-businesses.json";
import { manusGenerateDeliverables, manusGeneratePitch } from "./manus";
import type {
  Agent,
  CivilizationEvent,
  CivilizationState,
  Deal,
  DealPhase,
  EventType,
  Opportunity,
  Project,
  Skills,
} from "./types";

const INITIAL_COMPANY_BUDGET = 100;

const TEAM: {
  id: string;
  name: string;
  title: string;
  role: Agent["role"];
  primarySkill: keyof Skills;
}[] = [
  { id: "maya", name: "Maya", title: "Head of Research", role: "Research Lead", primarySkill: "research" },
  { id: "james", name: "James", title: "Sales Director", role: "Sales Lead", primarySkill: "sales" },
  { id: "priya", name: "Priya", title: "Operations Lead", role: "Operations Lead", primarySkill: "operations" },
  { id: "alex", name: "Alex", title: "Chief Strategist", role: "Strategist", primarySkill: "strategy" },
  { id: "sam", name: "Sam", title: "Delivery Engineer", role: "Delivery Engineer", primarySkill: "execution" },
];

const PHASE_ORDER: DealPhase[] = [
  "discovered",
  "researched",
  "awaiting_owner",
  "responded",
  "paid",
  "building",
  "delivered",
];

let eventCounter = 0;

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${++eventCounter}`;
}

function now(): string {
  return new Date().toISOString();
}

function offerPath(dealId: string): string {
  return `/offer/${dealId}`;
}

function sitePath(dealId: string): string {
  return `/site/${dealId}`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function agentById(state: CivilizationState, id: string): Agent | undefined {
  return state.agents.find((a) => a.id === id);
}

function createAgents(): Agent[] {
  return TEAM.map((t) => ({
    id: t.id,
    name: t.name,
    title: t.title,
    budget: 20,
    reputation: 0,
    role: t.role,
    skills: {
      research: t.primarySkill === "research" ? 4 : 2,
      sales: t.primarySkill === "sales" ? 4 : 2,
      operations: t.primarySkill === "operations" ? 4 : 2,
      strategy: t.primarySkill === "strategy" ? 4 : 2,
      execution: t.primarySkill === "execution" ? 4 : 2,
    },
    memory: [`${t.title} — ready to work.`],
  }));
}

/** Apply current TEAM names/titles to persisted agents (keeps budget, rep, skills). */
export function syncAgentRoster(state: CivilizationState): void {
  const freshById = new Map(createAgents().map((a) => [a.id, a]));

  for (const agent of state.agents) {
    const template = freshById.get(agent.id);
    if (template) {
      agent.name = template.name;
      agent.title = template.title;
      agent.role = template.role;
    }
  }

  // Pick up any new team members if roster grew
  for (const [id, template] of freshById) {
    if (!state.agents.some((a) => a.id === id)) {
      state.agents.push({ ...template });
    }
  }

  const byId = new Map(state.agents.map((a) => [a.id, a]));
  for (const event of state.events) {
    const leadId = event.agentIds?.[0];
    if (leadId) {
      const agent = byId.get(leadId);
      if (agent) {
        event.agentName = agent.name;
        event.agentTitle = agent.title;
      }
    }
  }
}

function addEvent(
  state: CivilizationState,
  type: EventType,
  title: string,
  body: string,
  opts?: Partial<CivilizationEvent>
): CivilizationEvent {
  const event: CivilizationEvent = {
    id: uid("evt"),
    timestamp: now(),
    type,
    title,
    body,
    ...opts,
  };
  state.events.unshift(event);
  if (state.events.length > 150) state.events.pop();
  return event;
}

function difficultyFromProblem(problem: string): "Low" | "Medium" | "High" {
  if (problem.length < 22) return "Low";
  if (problem.length < 35) return "Medium";
  return "High";
}

function valueFromDifficulty(d: "Low" | "Medium" | "High"): number {
  const ranges = { Low: [80, 150], Medium: [150, 280], High: [250, 450] };
  const [min, max] = ranges[d];
  return Math.floor(min + Math.random() * (max - min));
}

function solutionFor(problem: string, businessName: string): string {
  const p = problem.toLowerCase();
  if (p.includes("booking") || p.includes("scheduling") || p.includes("appointment")) {
    return `Add an online booking page to ${businessName}'s site — customers pick a slot, get SMS confirmation, and it syncs to the team's calendar.`;
  }
  if (p.includes("website") || p.includes("poor")) {
    return `Rebuild ${businessName}'s website with a clean mobile layout, service pages, and a contact form that routes leads to email.`;
  }
  if (p.includes("review")) {
    return `Set up an automated review request flow — after each visit, customers get a link to leave a Google review.`;
  }
  if (p.includes("delivery")) {
    return `Launch online ordering with local delivery slots and Stripe checkout on ${businessName}'s site.`;
  }
  if (p.includes("payment")) {
    return `Integrate online payments so ${businessName} can take card payments at booking or checkout.`;
  }
  if (p.includes("social")) {
    return `Create a 30-day social content plan and schedule posts for ${businessName} across Instagram and Facebook.`;
  }
  if (p.includes("loyalty")) {
    return `Build a simple loyalty programme — stamp card digital version with email reminders.`;
  }
  if (p.includes("e-commerce") || p.includes("catalog") || p.includes("inventory")) {
    return `Launch a product catalogue with photos, prices, and buy-online for ${businessName}.`;
  }
  return `Audit ${businessName}'s current setup and ship a focused fix for: ${problem.toLowerCase()}.`;
}

function buildSummaryFor(problem: string, businessName: string, url: string): string {
  const p = problem.toLowerCase();
  if (p.includes("booking") || p.includes("scheduling")) {
    return `Sam deployed a booking widget at ${url} — 3 time slots, email confirmations, and a calendar view for staff.`;
  }
  if (p.includes("website")) {
    return `Sam shipped a new 5-page site at ${url} — mobile-responsive, contact form wired to the owner's inbox.`;
  }
  if (p.includes("payment")) {
    return `Sam integrated Stripe checkout at ${url}/pay — card payments now work end-to-end.`;
  }
  return `Sam shipped the solution live at ${url} — owner can share the link with customers today.`;
}

function startNewDeal(state: CivilizationState): Deal | null {
  const used = new Set([
    ...state.deals.map((d) => d.businessName),
    ...(state.activeDeal ? [state.activeDeal.businessName] : []),
  ]);
  const available = businesses.filter((b) => !used.has(b.name));
  if (available.length === 0) return null;

  const business = available[Math.floor(Math.random() * available.length)];
  const difficulty = difficultyFromProblem(business.problem);
  const value = valueFromDifficulty(difficulty);
  const maya = state.agents.find((a) => a.id === "maya")!;
  const james = state.agents.find((a) => a.id === "james")!;
  const sam = state.agents.find((a) => a.id === "sam")!;

  const opportunity: Opportunity = {
    id: uid("opp"),
    title: `${business.name} — ${business.problem}`,
    businessName: business.name,
    problem: business.problem,
    city: business.city,
    sector: business.sector,
    value,
    difficulty,
    status: "in_progress",
    discoveredAt: now(),
  };

  const deal: Deal = {
    id: uid("deal"),
    opportunityId: opportunity.id,
    businessName: business.name,
    city: business.city,
    sector: business.sector,
    problem: business.problem,
    solution: solutionFor(business.problem, business.name),
    phase: "discovered",
    value,
    researchLeadId: maya.id,
    salesLeadId: james.id,
    opsLeadId: sam.id,
    startedAt: now(),
    previewSlug: slugify(business.name),
    siteFixed: false,
    chatLog: [],
  };

  state.opportunities.unshift(opportunity);
  state.activeDeal = deal;

  addEvent(state, "lead_discovered", `New lead: ${business.name}`, `${maya.name} (${maya.title}) spotted ${business.name} in ${business.city}. Sector: ${business.sector}.`, {
    phase: "discovered",
    dealId: deal.id,
    businessName: business.name,
    agentName: maya.name,
    agentTitle: maya.title,
    agentIds: [maya.id],
    meta: { city: business.city, sector: business.sector, value: `£${value}` },
  });

  return deal;
}

async function advanceDeal(state: CivilizationState, deal: Deal): Promise<void> {
  const idx = PHASE_ORDER.indexOf(deal.phase);
  if (idx < 0 || idx >= PHASE_ORDER.length - 1) return;

  const nextPhase = PHASE_ORDER[idx + 1];
  const maya = agentById(state, deal.researchLeadId)!;
  const james = agentById(state, deal.salesLeadId)!;
  const sam = agentById(state, deal.opsLeadId)!;

  deal.phase = nextPhase;
  const opp = state.opportunities.find((o) => o.id === deal.opportunityId);

  switch (nextPhase) {
    case "researched": {
      addEvent(
        state,
        "problem_analyzed",
        `Problem identified`,
        `${deal.businessName} is losing customers because: ${deal.problem.toLowerCase()}. Maya documented the gap from public listings and competitor sites.`,
        { phase: "researched", dealId: deal.id, businessName: deal.businessName, agentName: maya.name, agentTitle: maya.title, agentIds: [maya.id], meta: { problem: deal.problem } }
      );
      addEvent(
        state,
        "solution_proposed",
        `Solution designed`,
        deal.solution,
        {
          phase: "researched",
          dealId: deal.id,
          businessName: deal.businessName,
          agentName: agentById(state, "alex")?.name ?? "Alex Rivera",
          agentTitle: agentById(state, "alex")?.title ?? "Chief Strategist",
          agentIds: ["alex"],
          meta: { estimated: `£${deal.value}` },
        }
      );
      break;
    }
    case "awaiting_owner": {
      const fallback = `Hi there,

I'm James from Hands Off — we help ${deal.sector.toLowerCase()} businesses in ${deal.city}.

I reviewed ${deal.businessName}'s online presence and noticed: ${deal.problem.toLowerCase()}.

We'd fix this by: ${deal.solution}

Fixed price: £${deal.value} · Live within 14 days · You can chat with me and pay on your private offer page.

— James
Sales Director, Hands Off`;
      const manus = await manusGeneratePitch(
        james.name,
        { research: 2, sales: 4 },
        `${deal.businessName}: ${deal.problem}`,
        deal.value,
        fallback
      );
      deal.outreachMessage = manus.pitch;
      const offerUrl = offerPath(deal.id);
      const previewUrl = sitePath(deal.id);
      addEvent(
        state,
        "outreach_sent",
        `Outreach sent to ${deal.businessName}`,
        deal.outreachMessage,
        {
          phase: "awaiting_owner",
          dealId: deal.id,
          businessName: deal.businessName,
          agentName: james.name,
          agentTitle: james.title,
          agentIds: [james.id],
          meta: {
            channel: "Email + offer link",
            offer: offerUrl,
            website: previewUrl,
            amount: `£${deal.value}`,
          },
        }
      );
      break;
    }
    case "building": {
      deal.siteFixed = true;
      const siteUrl = sitePath(deal.id);
      deal.liveUrl = siteUrl;
      const fallback = {
        strategy: deal.solution,
        landingPage: `Fixed site: ${siteUrl}`,
        salesPitch: deal.outreachMessage ?? "",
      };
      const manus = await manusGenerateDeliverables(
        deal.businessName,
        deal.problem,
        deal.value,
        sam.name,
        1,
        fallback
      );
      deal.buildSummary = buildSummaryFor(deal.problem, deal.businessName, siteUrl);
      addEvent(
        state,
        "build_started",
        `Building solution`,
        `${sam.name} (${sam.title}) is implementing the fix on ${deal.businessName}'s website. ${manus.deliverables.strategy.slice(0, 200)}…`,
        {
          phase: "building",
          dealId: deal.id,
          businessName: deal.businessName,
          agentName: sam.name,
          agentTitle: sam.title,
          agentIds: [sam.id],
          meta: { url: siteUrl, preview: "Site updating…" },
        }
      );
      const project: Project = {
        id: uid("proj"),
        opportunityId: deal.opportunityId,
        dealId: deal.id,
        leadAgentId: sam.id,
        teamAgentIds: [sam.id, maya.id, james.id],
        status: "executing",
        deliverables: manus.deliverables,
        executionScore: 0,
        revenue: deal.value,
        manusEnhanced: manus.enhanced,
        manusTaskId: manus.taskId,
        createdAt: now(),
      };
      state.projects.unshift(project);
      break;
    }
    case "delivered": {
      deal.completedAt = now();
      const finalUrl = deal.liveUrl ?? sitePath(deal.id);
      deal.buildSummary =
        deal.buildSummary ?? buildSummaryFor(deal.problem, deal.businessName, finalUrl);
      const project = state.projects.find((p) => p.dealId === deal.id);
      if (project) {
        project.status = "completed";
        project.executionScore = 88 + Math.floor(Math.random() * 10);
      }
      if (opp) opp.status = "completed";
      addEvent(
        state,
        "build_shipped",
        `Solution live`,
        deal.buildSummary,
        { phase: "delivered", dealId: deal.id, businessName: deal.businessName, agentName: sam.name, agentTitle: sam.title, agentIds: [sam.id], meta: { url: finalUrl } }
      );
      addEvent(
        state,
        "deal_won",
        `Deal closed — ${deal.businessName}`,
        `Owner confirmed: "${deal.problem}" is fixed. They shared the link with customers. First bookings coming in.`,
        { phase: "delivered", dealId: deal.id, businessName: deal.businessName, meta: { revenue: `£${deal.value}` } }
      );
      sam.reputation += 2;
      sam.memory.unshift(`Shipped ${deal.businessName} — ${deal.liveUrl}`);
      state.deals.unshift({ ...deal });
      state.activeDeal = null;
      break;
    }
  }
}


export function createInitialState(): CivilizationState {
  eventCounter = 0;
  return {
    running: false,
    tick: 0,
    companyBudget: INITIAL_COMPANY_BUDGET,
    totalRevenue: 0,
    agents: createAgents(),
    opportunities: [],
    activeDeal: null,
    deals: [],
    projects: [],
    events: [],
    revenueHistory: [{ tick: 0, revenue: 0, at: now() }],
    lastTickAt: null,
  };
}

export async function runTick(state: CivilizationState): Promise<CivilizationState> {
  state.tick += 1;
  state.lastTickAt = now();

  if (state.tick === 1 && state.events.length === 0) {
    addEvent(
      state,
      "company_started",
      "Company is running",
      "Five specialists are working in the background. New leads will appear here step by step — problem, solution, outreach, payment, delivery.",
      {}
    );
  }

  // One phase per tick — pause while owner reviews offer portal
  if (state.activeDeal) {
    if (state.activeDeal.phase !== "awaiting_owner") {
      await advanceDeal(state, state.activeDeal);
    }
  } else {
    startNewDeal(state);
  }

  return state;
}

export function findDeal(state: CivilizationState, dealId: string): Deal | null {
  if (state.activeDeal?.id === dealId) return state.activeDeal;
  return state.deals.find((d) => d.id === dealId) ?? null;
}

/** Owner accepts on offer portal — chat done, payment taken, pipeline continues. */
export function acceptOwnerOffer(
  state: CivilizationState,
  dealId: string,
  lastOwnerMessage?: string
): { ok: boolean; error?: string } {
  const deal = findDeal(state, dealId);
  if (!deal) return { ok: false, error: "Deal not found" };
  if (deal.phase !== "awaiting_owner") return { ok: false, error: "Offer already actioned" };

  const james = agentById(state, deal.salesLeadId)!;
  const sam = agentById(state, deal.opsLeadId)!;

  deal.ownerAcceptedAt = now();
  deal.ownerResponse =
    lastOwnerMessage ??
    `Accepted — let's fix ${deal.problem.toLowerCase()}. Happy to pay £${deal.value}.`;
  deal.phase = "responded";

  addEvent(
    state,
    "owner_responded",
    `${deal.businessName} accepted the offer`,
    deal.ownerResponse,
    {
      phase: "responded",
      dealId: deal.id,
      businessName: deal.businessName,
      meta: { via: "Offer portal" },
    }
  );

  deal.paymentRef = `PAY-${uid("").slice(-8).toUpperCase()}`;
  deal.phase = "paid";
  state.companyBudget += deal.value;
  state.totalRevenue += deal.value;
  state.revenueHistory.push({ tick: state.tick, revenue: state.totalRevenue, at: now() });

  addEvent(
    state,
    "payment_received",
    `Payment received — £${deal.value}`,
    `Owner paid £${deal.value} via PayPal (ref ${deal.paymentRef}). Sam is building the fix now.`,
    {
      phase: "paid",
      dealId: deal.id,
      businessName: deal.businessName,
      agentName: james.name,
      agentTitle: james.title,
      agentIds: [james.id, sam.id],
      meta: { amount: `£${deal.value}`, ref: deal.paymentRef },
    }
  );
  addEvent(state, "revenue_earned", `Revenue +£${deal.value}`, `Company total: £${state.totalRevenue}`, {
    dealId: deal.id,
    businessName: deal.businessName,
    meta: { total: `£${state.totalRevenue}` },
  });

  james.reputation += 1;
  sam.reputation += 1;
  james.budget += Math.floor(deal.value * 0.1);
  sam.budget += Math.floor(deal.value * 0.1);

  return { ok: true };
}

export function addChatMessage(
  state: CivilizationState,
  dealId: string,
  ownerText: string,
  agentReply: string
): void {
  const deal = findDeal(state, dealId);
  if (!deal) return;
  if (!deal.chatLog) deal.chatLog = [];
  const t = now();
  deal.chatLog.push({ role: "owner", text: ownerText, at: t });
  deal.chatLog.push({ role: "agent", text: agentReply, at: now() });
}

export function getActiveProjects(state: CivilizationState): number {
  return state.projects.filter((p) => p.status === "executing").length;
}

export function getOpenOpportunities(state: CivilizationState): number {
  return state.opportunities.filter((o) => o.status === "in_progress" || o.status === "open").length;
}

export function phaseLabel(phase: DealPhase): string {
  const labels: Record<DealPhase, string> = {
    discovered: "Lead found",
    researched: "Problem & solution",
    outreach: "Outreach sent",
    awaiting_owner: "Waiting for owner",
    responded: "Owner replied",
    paid: "Payment received",
    building: "Building fix",
    delivered: "Delivered",
    lost: "Lost",
  };
  return labels[phase];
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
