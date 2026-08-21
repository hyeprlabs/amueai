import { PLANS, type Plan } from "./plans";

/**
 * Human-readable copy for the `resource:value` feature strings in PLANS.
 *
 * Shared by the billing settings page and the marketing pricing table so the
 * allowances a customer reads before paying and the ones they see after are
 * generated from the same map — a plan limit changed in plans.ts can't leave a
 * stale hand-written string advertising the old number.
 *
 * No `server-only` here: the pricing page is a Client Component.
 */
export function featureLabel(feature: string): string {
  const [key, value] = feature.split(":");
  switch (key) {
    case "chatbots":
      return `${value} chatbot${value === "1" ? "" : "s"}`;
    case "sources":
      return `${Number(value).toLocaleString("de-DE")} sources per chatbot`;
    case "seats":
      return `${value} team member${value === "1" ? "" : "s"}`;
    case "models":
      return value === "all" ? "All AI models" : "Mini model only";
    case "branding":
      return "Remove AmueAI branding";
    case "api":
      return "API access";
    case "leads":
      return "Lead capture";
    case "topups":
      return "Credit top-ups";
    case "custom-domain":
      return "Custom widget domain";
    case "channels":
      return `${value === "slack" ? "Slack" : "WhatsApp"} channel`;
    case "roles":
      return "Custom roles & permissions";
    case "analytics":
      return value === "export" ? "CSV export" : `Analytics retention: ${value}`;
    default:
      return feature;
  }
}

/** Every feature of a plan, already rendered as display copy. */
export function featureLabels(plan: Plan): string[] {
  return PLANS[plan].features.map(featureLabel);
}
