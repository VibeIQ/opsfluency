// v1.0.0
// FAQ accordion. Hand-rolled (no new dep) but uses the same pattern
// Radix would: button with aria-expanded, region with aria-labelledby
// pointing at the button. Expand/collapse via a max-height transition,
// which collapses to 0.01ms under prefers-reduced-motion thanks to the
// global CSS rule in app/globals.css.

"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";

type QA = { question: string; answer: string };

const FAQ: QA[] = [
  {
    question: "What happens when we cross an employee tier boundary?",
    answer:
      "If you grow past your tier's ceiling we reach out and help you move up at the next billing cycle. Nobody gets cut off mid-shift. Going the other direction (shrinking back to a smaller tier) also works at the next cycle.",
  },
  {
    question: "Is there a setup fee?",
    answer:
      "No. Setup is self-serve and takes under an hour. Scale tier includes a live onboarding workshop. Enterprise includes a dedicated customer success manager.",
  },
  {
    question: "What languages beyond Spanish?",
    answer:
      "MVP is English and Spanish. Vietnamese, Mandarin, Portuguese, and Arabic are on the Phase 2 roadmap. If the order of arrival matters to your team, tell us on the contact page and we'll put a finger on the scale.",
  },
  {
    question: "Can I cancel monthly?",
    answer:
      "Yes. Month-to-month cancels any time with no penalty. Annual runs through the term you paid for and cancels at the end of the term. We do not pro-rate partial months.",
  },
  {
    question: "Does it integrate with my HRIS?",
    answer:
      "Not in MVP. ADP, Paychex, and Gusto integrations are Phase 2. Today, workers are invited via email or SMS magic links, so there is no sync dance required to get started.",
  },
  {
    question: "Do I need hardware?",
    answer:
      "No. Workers use their own phones (the PWA works without an app-store download). Monitors are any browser-capable TV or display. Point the browser at the pairing URL, scan the pairing QR from your dashboard, and it is live.",
  },
  {
    question: "What about custom or unusual SOPs?",
    answer:
      "Drop them in. The AI handles any PDF, Word doc, or text file. No template required. Site-specific terms get flagged for you to define once, and the glossary remembers them forever.",
  },
  {
    question: "What is the uptime SLA?",
    answer:
      "We run on Vercel + Supabase production, which both operate at 99.99% historical uptime. Enterprise gets a written SLA with service credits. Lower tiers get best-effort backed by the same infrastructure.",
  },
];

const HEADING_ID = "pricing-faq-heading";

function Item({
  qa,
  idBase,
  open,
  onToggle,
}: {
  qa: QA;
  idBase: string;
  open: boolean;
  onToggle: () => void;
}) {
  const buttonId = `${idBase}-q`;
  const panelId = `${idBase}-a`;

  return (
    <div className="border-b border-dc-edge last:border-b-0">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-6 py-5 text-left text-dc-text hover:text-[var(--color-brand)] transition-colors"
      >
        <span
          className="text-base font-semibold md:text-lg"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {qa.question}
        </span>
        <ChevronDown
          className={[
            "h-5 w-5 shrink-0 transition-transform duration-200 ease-out",
            open ? "rotate-180" : "rotate-0",
          ].join(" ")}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        style={{
          maxHeight: open ? "600px" : "0px",
          transition: "max-height 250ms ease-out",
          overflow: "hidden",
        }}
      >
        <p className="pb-5 pr-10 text-base leading-relaxed text-dc-text-2">
          {qa.answer}
        </p>
      </div>
    </div>
  );
}

export function PricingFAQ() {
  const reactId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby={HEADING_ID} className="py-16 md:py-24 bg-dc-raised">
      <Container width="narrow" className="flex flex-col gap-8">
        <SectionHeader
          id={HEADING_ID}
          eyebrow="FAQ"
          heading="The questions managers actually ask."
          subhead="If yours isn't here, the contact page goes directly to Rob."
          align="left"
        />
        <div>
          {FAQ.map((qa, index) => (
            <Item
              key={qa.question}
              qa={qa}
              idBase={`${reactId}-${index}`}
              open={openIndex === index}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
