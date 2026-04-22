// v1.0.0
// Pricing page. The billing toggle drives prices across three sections,
// so all three live inside a single BillingProvider. Everything else is
// plain section composition.

import type { Metadata } from "next";

import { BillingProvider } from "@/components/marketing/pricing/billing-context";
import { PricingBillingToggle } from "@/components/marketing/pricing/PricingBillingToggle";
import { PricingComparison } from "@/components/marketing/pricing/PricingComparison";
import { PricingExpenseCallout } from "@/components/marketing/pricing/PricingExpenseCallout";
import { PricingFAQ } from "@/components/marketing/pricing/PricingFAQ";
import { PricingFinalCTA } from "@/components/marketing/pricing/PricingFinalCTA";
import { PricingHero } from "@/components/marketing/pricing/PricingHero";
import { PricingTierGrid } from "@/components/marketing/pricing/PricingTierGrid";

export const metadata: Metadata = {
  title: "OpsFluency pricing: flat rate, no per-user fees",
  description:
    "Four tiers from $79 a month. Flat rate, no per-user fees. Growth is expensable without committee approval. 14-day free trial, no credit card.",
  openGraph: {
    title: "OpsFluency pricing",
    description:
      "Starter $79. Growth $119. Scale $199. Enterprise custom. Flat rate, no per-user fees.",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <BillingProvider>
        <PricingBillingToggle />
        <PricingTierGrid />
        <PricingComparison />
      </BillingProvider>
      <PricingExpenseCallout />
      <PricingFAQ />
      <PricingFinalCTA />
    </>
  );
}
