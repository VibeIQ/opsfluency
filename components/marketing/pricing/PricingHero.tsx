// v1.0.0
// Pricing hero. Narrow container per the pricing override.

import { Hero } from "@/components/marketing/Hero";

export function PricingHero() {
  return (
    <Hero
      ariaLabel="Pricing"
      eyebrow="Pricing"
      headline="Flat rate. No per-user fees."
      subhead="Growth is $119 a month on annual, $149 month-to-month. Your manager can expense that without a committee. Start on a 14-day free trial, no credit card."
    />
  );
}
