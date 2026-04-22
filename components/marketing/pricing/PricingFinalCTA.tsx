// v1.0.0
// Pricing page final CTA. 14-day free trial messaging.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { CTABlock } from "@/components/marketing/CTABlock";

export function PricingFinalCTA() {
  return (
    <CTABlock
      ariaLabel="Start 14-day free trial"
      heading="Start a 14-day free trial. No credit card required."
      subhead="First bilingual SOP published in under 15 minutes. If it is not obviously useful by the end of the trial, cancel in one click."
      primary={
        <Button
          href="/sign-up"
          size="lg"
          className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
          trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
        >
          Start free trial
        </Button>
      }
      secondary={
        <Button
          href="/contact"
          variant="secondary"
          size="lg"
          className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
        >
          Talk to Rob
        </Button>
      }
    />
  );
}
