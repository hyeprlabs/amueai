import { describe, expect, it } from "vitest";

import { creditAlertLevel, percentConsumed } from "@/lib/billing/thresholds";

describe("creditAlertLevel", () => {
  it("stays silent well above the threshold", () => {
    expect(creditAlertLevel(5000, 0, 5000)).toBe(0);
    expect(creditAlertLevel(1100, 0, 5000)).toBe(0); // 22% left
  });

  it("fires at 80% consumed (20% of the allowance left)", () => {
    expect(creditAlertLevel(1000, 0, 5000)).toBe(80);
    expect(creditAlertLevel(500, 0, 5000)).toBe(80);
    expect(creditAlertLevel(1, 0, 5000)).toBe(80);
  });

  it("fires at 100% only when the balance is actually exhausted", () => {
    expect(creditAlertLevel(0, 0, 5000)).toBe(100);
  });

  it("treats an overdrafted balance as 100%", () => {
    expect(creditAlertLevel(0, -15, 5000)).toBe(100);
  });

  it("does not warn an org whose top-up credits still cover them", () => {
    // Plan credits exhausted, but 40k top-ups banked — they are not about to
    // stop answering messages, so no alert.
    expect(creditAlertLevel(0, 40_000, 5000)).toBe(0);
  });

  it("warns once top-ups are also nearly gone", () => {
    expect(creditAlertLevel(0, 900, 5000)).toBe(80);
  });

  it("handles a zero allowance without dividing by zero", () => {
    expect(creditAlertLevel(10, 0, 0)).toBe(0);
    expect(creditAlertLevel(0, 0, 0)).toBe(100);
  });
});

describe("percentConsumed", () => {
  it("reports consumption against the monthly allowance", () => {
    expect(percentConsumed(5000, 0, 5000)).toBe(0);
    expect(percentConsumed(2500, 0, 5000)).toBe(50);
    expect(percentConsumed(0, 0, 5000)).toBe(100);
  });

  it("clamps to 0-100 when top-ups exceed the allowance", () => {
    expect(percentConsumed(5000, 40_000, 5000)).toBe(0);
  });

  it("clamps to 100 on overdraft rather than reporting over 100", () => {
    expect(percentConsumed(0, -500, 5000)).toBe(100);
  });
});
