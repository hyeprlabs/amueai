import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

import { siteConfig } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { PLANS, type Plan } from "./plans";
import { creditAlertLevel } from "./thresholds";

/**
 * 80% / 100% credit alerts (docs/billing-spec.md §7a, §8).
 * "A customer who gets an email at 80% can investigate an anomaly themselves.
 * A customer whose widget silently dies at 100% churns."
 *
 * Fires at most once per threshold per billing period — claim_credit_alert()
 * does the deduplication atomically, and grant_monthly_credits() resets the
 * level each month.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Checks the org's remaining balance against its monthly allowance and emails
 * billing admins if a threshold was newly crossed. Never throws — an alerting
 * failure must not fail the chat request that triggered it.
 */
export async function maybeSendCreditAlert(orgId: string): Promise<void> {
  try {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("plan, plan_credits, topup_credits, name")
      .eq("clerk_org_id", orgId)
      .is("deleted_at", null)
      .single();
    if (!org) return;

    const monthlyAllowance = PLANS[org.plan as Plan]?.monthlyCredits ?? 0;
    const planCredits = org.plan_credits ?? 0;
    const topupCredits = org.topup_credits ?? 0;
    const balance = planCredits + topupCredits;

    // Same function the dashboard meter uses, so the banner a customer sees
    // and the email they receive can never disagree.
    const level = creditAlertLevel(planCredits, topupCredits, monthlyAllowance);
    if (level === 0) return;

    // Pre-flight BEFORE claiming. The claim is one-shot per threshold per
    // period, so consuming it and then discovering we can't deliver burns the
    // only alert this org was going to get. Checking first leaves the claim
    // unspent, so the next request that crosses the threshold tries again.
    if (!resend) {
      console.warn("RESEND_API_KEY not set — cannot send credit alert", { orgId, level });
      return;
    }
    const recipients = await billingAdminEmails(orgId);
    if (recipients.length === 0) return;

    // Atomic claim: concurrent requests crossing the threshold together
    // produce exactly one email.
    const { data: claimed, error: claimError } = await supabaseAdmin.rpc("claim_credit_alert", {
      p_org_id: orgId,
      p_level: level,
    });
    if (claimError) throw claimError;
    if (!claimed) return;

    await sendCreditEmail({
      orgId,
      recipients,
      orgName: org.name,
      level,
      balance,
      monthlyAllowance,
    });
  } catch (err) {
    console.error("credit alert failed", { orgId, err });
  }
}

async function sendCreditEmail(params: {
  orgId: string;
  recipients: string[];
  orgName: string;
  level: number;
  balance: number;
  monthlyAllowance: number;
}) {
  const { recipients } = params;
  if (!resend) throw new Error("RESEND_API_KEY not set");

  const billingUrl = `${siteConfig.url}/settings/billing`;
  const isOut = params.level === 100;
  // orgName is Clerk organization.name — admin-editable, so it's untrusted
  // input by the time it reaches an HTML email body.
  const orgName = escapeHtml(params.orgName);

  // Resend RESOLVES with { error } rather than rejecting — an unchecked await
  // here reports every bounced or rejected send as a successful alert.
  const { error } = await resend.emails.send(
    {
      from: `${siteConfig.name} <${siteConfig.email}>`,
      to: recipients,
      subject: isOut
        ? `${params.orgName} has run out of ${siteConfig.name} credits`
        : `${params.orgName} has used 80% of its ${siteConfig.name} credits`,
      html: isOut
        ? `<p>Your organization <strong>${orgName}</strong> has used all of its monthly credits.</p>
         <p>Your chatbots are showing their fallback message instead of answering until you top up or your credits renew.</p>
         <p><a href="${billingUrl}">Top up credits</a></p>`
        : `<p>Your organization <strong>${orgName}</strong> has used 80% of its monthly credits.</p>
         <p><strong>${params.balance.toLocaleString("de-DE")}</strong> of ${params.monthlyAllowance.toLocaleString("de-DE")} credits remaining.</p>
         <p>If that's more usage than you expected, it's worth checking your chatbots' traffic.</p>
         <p><a href="${billingUrl}">View billing</a></p>`,
    },
    {
      // Stable across retries of the same threshold in the same period, so a
      // retried send can never produce a second email.
      idempotencyKey: `credit-alert:${params.orgId}:${params.level}:${currentPeriod()}`,
    },
  );
  if (error) throw new Error(`Resend failed to send credit alert: ${JSON.stringify(error)}`);
}

/** YYYY-MM — matches grant_monthly_credits()'s period, which resets alert levels. */
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Email addresses of members who can act on this — i.e. org admins. */
async function billingAdminEmails(orgId: string): Promise<string[]> {
  const clerk = await clerkClient();
  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });

  return memberships.data
    .filter((m) => m.role === "org:admin")
    .map((m) => m.publicUserData?.identifier)
    .filter((email): email is string => Boolean(email));
}
