// v1.0.0
// Expense-friendly callout. Single teal-tinted card that answers the
// question managers actually ask out loud: "can I expense this without
// approval?"

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "pricing-expense-heading";

export function PricingExpenseCallout() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-10 md:py-16"
    >
      <Container width="narrow">
        <div className="rounded-xl border border-[var(--color-brand)] bg-[color-mix(in_srgb,var(--color-brand-50)_50%,transparent)] p-6 md:p-8 dark:bg-[color-mix(in_srgb,var(--color-brand-dim)_15%,transparent)]">
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Deliberately priced
          </span>
          <h2
            id={HEADING_ID}
            className="mt-3 text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Can I expense this without asking my boss?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-dc-text-2 md:text-lg">
            At most companies: yes. Growth at $119 on annual (or $149 month-to-month) sits under the common $150 per-month expense approval threshold, and under the $2,500 annual single-approver line. That is on purpose. Frontline managers should not need a procurement committee to fix frontline problems.
          </p>
        </div>
      </Container>
    </MotionSection>
  );
}
