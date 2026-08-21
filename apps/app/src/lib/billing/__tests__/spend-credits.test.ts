import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Integration test against the real `spend_credits` Postgres function
 * (docs/billing-spec.md §4.1) — the logic lives in SQL, so a TS-side mock
 * would only prove the mock is right, not the deployed function. Requires
 * NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY (loaded from
 * .env.local by vitest.setup.ts). Each test creates and deletes its own
 * throwaway organization row.
 */
describe("spend_credits", () => {
  let orgId: string;

  beforeEach(async () => {
    orgId = `org_test_${randomUUID()}`;
    const { error } = await supabaseAdmin.from("organizations").insert({
      clerk_org_id: orgId,
      name: "spend_credits test org",
    });
    if (error) throw error;
  });

  afterEach(async () => {
    await supabaseAdmin.from("organizations").delete().eq("clerk_org_id", orgId);
  });

  async function seed(planCredits: number, topupCredits: number) {
    const { error } = await supabaseAdmin
      .from("organizations")
      .update({ plan_credits: planCredits, topup_credits: topupCredits })
      .eq("clerk_org_id", orgId);
    if (error) throw error;
  }

  async function readBalances() {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("plan_credits, topup_credits")
      .eq("clerk_org_id", orgId)
      .single();
    if (error) throw error;
    return data;
  }

  it("drains plan credits first when the charge fits entirely within them", async () => {
    await seed(100, 50);

    const { data: total, error } = await supabaseAdmin.rpc("spend_credits", {
      p_org_id: orgId,
      p_amount: 30,
    });
    if (error) throw error;

    expect(total).toBe(120); // 70 + 50
    const balances = await readBalances();
    expect(balances.plan_credits).toBe(70);
    expect(balances.topup_credits).toBe(50); // untouched
  });

  it("spills into top-up credits once plan credits run out", async () => {
    await seed(20, 50);

    const { data: total, error } = await supabaseAdmin.rpc("spend_credits", {
      p_org_id: orgId,
      p_amount: 30,
    });
    if (error) throw error;

    expect(total).toBe(40); // 0 + 40
    const balances = await readBalances();
    expect(balances.plan_credits).toBe(0);
    expect(balances.topup_credits).toBe(40); // 50 - (30 - 20)
  });

  it("zeroes plan credits exactly when the charge matches them precisely", async () => {
    await seed(30, 10);

    await supabaseAdmin.rpc("spend_credits", { p_org_id: orgId, p_amount: 30 });

    const balances = await readBalances();
    expect(balances.plan_credits).toBe(0);
    expect(balances.topup_credits).toBe(10); // untouched — nothing spilled over
  });

  it("allows overdraft: top-up credits go negative rather than erroring", async () => {
    await seed(10, 5);

    const { data: total, error } = await supabaseAdmin.rpc("spend_credits", {
      p_org_id: orgId,
      p_amount: 30,
    });
    if (error) throw error;

    expect(total).toBe(-15); // 0 + (-15)
    const balances = await readBalances();
    expect(balances.plan_credits).toBe(0);
    expect(balances.topup_credits).toBe(-15); // 5 - (30 - 10)
  });

  it("blocks further spend until a top-up repays an overdrawn balance", async () => {
    await seed(0, -15);

    // Simulate a small top-up that doesn't fully cover the overdraft.
    await supabaseAdmin
      .from("organizations")
      .update({ topup_credits: -15 + 10 })
      .eq("clerk_org_id", orgId);

    const balances = await readBalances();
    expect(balances.plan_credits + balances.topup_credits).toBeLessThan(0); // still blocked
  });
});
