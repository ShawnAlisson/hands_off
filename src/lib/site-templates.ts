export type SiteVariant =
  | "booking"
  | "portal"
  | "website"
  | "reviews"
  | "payments"
  | "generic";

export function siteVariantForProblem(problem: string): SiteVariant {
  const p = problem.toLowerCase();
  if (p.includes("booking") || p.includes("scheduling") || p.includes("appointment")) return "booking";
  if (p.includes("portal") || p.includes("client")) return "portal";
  if (p.includes("website") || p.includes("poor")) return "website";
  if (p.includes("review")) return "reviews";
  if (p.includes("payment")) return "payments";
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
    generic: "Digital solution",
  };
  return labels[variant];
}
