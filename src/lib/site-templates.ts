export type SiteVariant =
  | "booking"
  | "portal"
  | "website"
  | "reviews"
  | "payments"
  | "delivery"
  | "loyalty"
  | "ecommerce"
  | "generic";

export function siteVariantForProblem(problem: string): SiteVariant {
  const p = problem.toLowerCase();
  if (p.includes("booking") || p.includes("scheduling") || p.includes("appointment") || p.includes("class")) {
    return "booking";
  }
  if (p.includes("portal") || p.includes("client")) return "portal";
  if (p.includes("website") || p.includes("poor")) return "website";
  if (p.includes("review")) return "reviews";
  if (p.includes("payment")) return "payments";
  if (p.includes("delivery") || p.includes("reservation")) return "delivery";
  if (p.includes("loyalty")) return "loyalty";
  if (p.includes("e-commerce") || p.includes("catalog") || p.includes("inventory")) return "ecommerce";
  return "generic";
}

export function isSiteFixed(phase: string): boolean {
  return phase === "building" || phase === "delivered";
}

export function missingFeatureLabel(variant: SiteVariant): string {
  const labels: Record<SiteVariant, string> = {
    booking: "Online booking",
    portal: "Client portal",
    website: "Modern website",
    reviews: "Review collection",
    payments: "Online payments",
    delivery: "Online ordering",
    loyalty: "Loyalty programme",
    ecommerce: "Online shop",
    generic: "Digital solution",
  };
  return labels[variant];
}

export function sectorAccent(sector: string): { from: string; to: string; ring: string } {
  const s = sector.toLowerCase();
  if (s.includes("health") || s.includes("dental")) return { from: "from-teal-600", to: "to-cyan-500", ring: "ring-teal-500" };
  if (s.includes("legal")) return { from: "from-slate-700", to: "to-slate-500", ring: "ring-slate-600" };
  if (s.includes("food") || s.includes("cafe") || s.includes("bakery")) return { from: "from-amber-600", to: "to-orange-500", ring: "ring-amber-500" };
  if (s.includes("fitness") || s.includes("gym")) return { from: "from-violet-600", to: "to-purple-500", ring: "ring-violet-500" };
  if (s.includes("beauty")) return { from: "from-pink-600", to: "to-rose-500", ring: "ring-pink-500" };
  return { from: "from-blue-600", to: "to-indigo-500", ring: "ring-blue-500" };
}
