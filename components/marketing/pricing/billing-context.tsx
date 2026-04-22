// v1.0.0
// Shared state for the pricing page. The annual / month-to-month toggle
// lives in one section but affects two others, so we lift the state into
// a small client-side context that wraps all three.

"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BillingMode = "annual" | "monthly";

type BillingContextValue = {
  mode: BillingMode;
  setMode: (mode: BillingMode) => void;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<BillingMode>("annual");
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
}

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error("useBilling must be used inside <BillingProvider>");
  }
  return ctx;
}

export type Tier = {
  slug: "starter" | "growth" | "scale" | "enterprise";
  name: string;
  employees: string;
  annual: number | "custom";
  monthly: number | "custom";
  featured?: boolean;
  tagline: string;
};

export const TIERS: Tier[] = [
  {
    slug: "starter",
    name: "Starter",
    employees: "Up to 50",
    annual: 79,
    monthly: 99,
    tagline: "One facility, one manager, first shift on Spanish.",
  },
  {
    slug: "growth",
    name: "Growth",
    employees: "51 to 150",
    annual: 119,
    monthly: 149,
    featured: true,
    tagline: "Most teams land here. Expensable without approval.",
  },
  {
    slug: "scale",
    name: "Scale",
    employees: "151 to 500",
    annual: 199,
    monthly: 249,
    tagline: "Multi-department, multi-shift, with priority support.",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    employees: "500+",
    annual: "custom",
    monthly: "custom",
    tagline: "SSO, written SLA, dedicated CSM, volume pricing.",
  },
];

export function priceFor(tier: Tier, mode: BillingMode): string {
  const raw = mode === "annual" ? tier.annual : tier.monthly;
  if (raw === "custom") return "Custom";
  return `$${raw}`;
}
