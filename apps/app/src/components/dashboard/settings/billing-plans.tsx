"use client";

import { PricingTable } from "@clerk/nextjs";

import { Skeleton } from "@/components/ui/skeleton";

function PricingTableFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-72 w-full rounded-lg" key={index} />
      ))}
    </div>
  );
}

export function BillingPlans() {
  return (
    <PricingTable
      fallback={<PricingTableFallback />}
      for="organization"
      newSubscriptionRedirectUrl="/settings/billing"
    />
  );
}
