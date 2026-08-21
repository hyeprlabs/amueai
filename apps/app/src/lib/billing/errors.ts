export type BillingErrorCode =
  | "NO_ORG"
  | "FORBIDDEN"
  | "INSUFFICIENT_CREDITS"
  | "PLAN_LIMIT"
  | "FEATURE_LOCKED";

export class BillingError extends Error {
  code: BillingErrorCode;
  details?: Record<string, unknown>;

  constructor(code: BillingErrorCode, details?: Record<string, unknown>) {
    super(code);
    this.name = "BillingError";
    this.code = code;
    this.details = details;
  }
}
