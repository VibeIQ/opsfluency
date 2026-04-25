# OpsFluency — pricing & unit economics

> Last updated: April 2026 (post-MVP cost measurement on real Sonnet 4.6 conversions).
> Source data: `ai_call_log` table + Anthropic / Google / Vercel / Supabase public pricing.

This is a working document. When real customers hit volume that contradicts these
numbers, update the table and revisit the recommendation — don't let the doc drift.

---

## TL;DR

- **Model: flat subscription per facility / location.** No per-user, no per-SOP metering for MVP.
- **Suggested tiers:**

  | Tier | Price | Includes |
  |---|---|---|
  | Starter | **$149 / facility / mo** | Unlimited workers, unlimited SOPs, 4 default departments, QR codes |
  | Pro | **$349 / facility / mo** | Everything in Starter + monitor displays, HR module, scan analytics |
  | Enterprise | Custom | Multi-location rollups, SSO, dedicated support |

- **Why flat:** AI cost is small enough to absorb (~$10/tenant/year for typical usage), and metering creates more friction than savings at MVP scale. Customers buy *outcomes* (worker safety, training velocity), not tokens.

---

## Real measured AI cost per SOP

Public Anthropic pricing for `claude-sonnet-4-6` at time of writing:

- Input:  **$3 per million tokens**
- Output: **$15 per million tokens**

A measured 4-page receiving SOP (PDF, digital text) through `lib/ai/sop-conversion.ts`:

| Resource | Per call | Per SOP (1 call) |
|---|---|---|
| Input tokens | ~8,700 | $0.026 |
| Output tokens (markdown + flagged terms) | ~4,650 | $0.070 |
| **Total Sonnet cost** | | **~$0.10** |

Plus translation:

- Google Cloud Translation v2: **$20 per million characters**
- Average SOP markdown: ~5,000 characters → **~$0.001** per SOP
- Negligible at any scale below 10M characters/month.

**Lifetime per-SOP cost: ~$0.10 + ~$0.001 ≈ $0.10.** Re-translations on edits double or triple this; a heavily-revised SOP might cost $0.30 over its life.

### Where the input tokens go

A 4-page PDF sent to Sonnet's `document` block burns ~1.5k–2k tokens *per page* for vision. The system prompt + glossary is ~1.5k. The user instruction is ~50. Document content dominates the input bill.

For text-only `.txt` uploads, input cost drops 5–10× because Sonnet processes raw text instead of vision-tokenized pages. Worth knowing if a tenant is bulk-importing.

---

## Tenant cost projections

Conservative estimates from typical frontline-ops adoption patterns:

| Stage | Volume | AI cost |
|---|---|---|
| Onboarding burst (week 1–2) | 30–60 SOPs | $3–6 one-time |
| Steady state (month 2+) | 5–10 new SOPs / month | $0.50–1 / month |
| Edits + re-translations | ~5 / month | $0.50 / month |
| **Year 1 total per tenant** | ~80 SOPs | **~$10** |

A heavy outlier — a customer publishing 500 SOPs in year 1 — runs about $50 in AI cost. Still well inside the gross margin on a single $149/mo tier.

---

## Margin math

At Starter ($149/mo per facility):

| Line item | Cost / mo |
|---|---|
| AI (typical tenant)            | $1 |
| AI (heavy tenant)              | $5 |
| Stripe / Paddle fees (~3%)     | $4.50 |
| Vercel function-seconds + bandwidth (per facility) | ~$1 |
| Supabase storage + bandwidth (per facility) | ~$1 |
| **Total cost (typical)**       | **~$7.50** |
| **Gross margin (typical)**     | **~95%** |
| **Gross margin (heavy)**       | **~92%** |

The math holds at $99/mo and stays healthy ($85+ contribution margin) even with a 5× cost spike in one of the lines.

---

## Why per-facility (not per-user)

CLAUDE.md → "What Not to Build in MVP" already excludes per-user pricing. The reasoning, in case it ever gets re-litigated:

1. **Frontline turnover is high.** Per-seat billing punishes customers for the exact thing the product is supposed to handle (onboarding new workers fast).
2. **Buyers think in facilities.** Warehouse and plant budgets are organized by location. Asking a regional ops manager to forecast headcount per shift is harder than approving a per-site line item.
3. **Comp set:** Beekeeper at $5–10 / employee / mo means a 50-person warehouse pays $250–500 / mo. OpsFluency at $149 / facility wins on price for any site with more than ~30 workers, and beats it on scope (operations + bilingual, not just comms).
4. **Anti-feature:** counting workers creates an incentive to under-invite, which kneecaps adoption.

---

## Why no SOP metering (yet)

Three reasons to keep "unlimited SOPs" in every tier:

1. **Math says you can.** Even a tenant burning $20/mo in AI is still 87% margin at $149.
2. **Token limits feel punitive.** The product's value prop is "publish freely in any language" — a meter contradicts that on the marketing page.
3. **You want them uploading.** Every published SOP is more lock-in, more renewal stickiness, more value the customer realizes. Don't put a meter on the thing you want them to do.

---

## Cost lines to actually watch

In rough order of likelihood that they'll bite first.

### 1. Anthropic spend cap *(do this now)*

Set a hard monthly limit in the Anthropic console. **$200/mo is plenty of headroom for the first 6 months of customers.** A bug or bad actor that runs unchecked AI calls is the only realistic path to a ruinous bill.

### 2. Per-tenant rate limits *(add when paying customers exist)*

`createSopFromUpload` should rate-limit per tenant. Suggested initial caps:

- 100 conversions per hour
- 200 conversions per day

Surfaces in the platform console as a soft alert at 50/day per tenant, hard refusal at the cap with a "fair use" message.

### 3. Storage growth

Every SOP retains the original PDF + every `sop_versions` row. At 5MB average × 500 SOPs × 100 tenants = ~250GB. Supabase Storage is **~$0.021 / GB / mo** = $5/mo total. Fine forever for MVP.

### 4. Vercel function-seconds

SOP conversions hold a serverless function for 30–90 seconds. With `maxDuration = 300` pinned on the SOP detail page, this scales linearly with conversion volume but is much smaller than the AI line. At 1000 conversions/mo × 60s avg = 60,000 GB-seconds, well inside Pro's included quota.

### 5. Vercel bandwidth

Worker-side reads of SOPs are tiny (markdown is plain text). Even at 100 workers × 50 SOP reads / day × 30 days = 150,000 reads / mo / tenant → totally negligible bandwidth.

---

## Optimization levers (when AI cost actually matters)

Listed by quality risk. None are needed for MVP — but write them down so you don't have to re-derive them in 6 months.

| Lever | Savings | Quality risk | Effort |
|---|---|---|---|
| **Prompt caching** on the system prompt + glossary | 10–20% on input cost; bigger if a tenant uploads SOPs in bursts (cache hits drop input → 0.1× normal price) | None — same model, same prompt | Small — one `cache_control: { type: 'ephemeral' }` on the system block in `lib/ai/sonnet.ts` |
| **Pre-extract text from digital PDFs** — skip vision when the PDF has a text layer | 5–10× cheaper input on text-layer PDFs (most managers' Word→PDF exports) | Modest — loses some table/diagram fidelity. A/B against vision on a real SOP set first | Medium — `pdf-parse` dependency, conditional dispatch in `lib/ai/sop-conversion.ts` |
| **Switch to Haiku 4.5** for conversion | ~67% off ($1 input / $5 output per M) | Real — CLAUDE.md says "Sonnet, never Haiku" because of consistency on flagged terms. Worth re-evaluating with Haiku 4.5 quality, but it's a spec change | Small — model id swap + spec update |

---

## When to revisit metering

Two triggers, either of which earns a fresh look at the model:

1. **A real customer's AI spend exceeds 30% of their subscription price.** At Starter ($149) that's $45/mo, requiring ~450 conversions/mo — wildly above any normal usage profile.
2. **A Phase-2 feature lands that is genuinely AI-heavy and consumption-driven** (e.g., on-demand voice translation, real-time worker chat translation). That feature earns its own usage-based add-on rather than retrofitting metering onto SOPs.

---

## Explicitly out of scope for MVP pricing

Do not build, do not promise, do not field-of-view this product around:

- Per-user / per-seat pricing tiers
- Per-SOP overage billing
- Per-language pricing (Spanish is included; Phase 2 langs earn their own SKU)
- Custom onboarding fees on Starter (only Enterprise)
- Annual prepay discounts before there are 10 paying customers — pricing is still being calibrated; locking customers in at the wrong number is worse than missing the discount

---

## Reference: where the numbers come from

| Source | What it gives us |
|---|---|
| `ai_call_log` (Supabase) | Actual measured tokens + duration per Sonnet call. The per-tenant rollups on `/dashboard/platform` → AI usage tab read from this. |
| [Anthropic pricing](https://www.anthropic.com/pricing) | $3/M input, $15/M output for Sonnet 4.6; $1/M and $5/M for Haiku 4.5. |
| [Google Cloud Translation pricing](https://cloud.google.com/translate/pricing) | $20 / M characters for v2 standard. |
| Vercel + Supabase dashboards | Monthly bill for serverless + storage. |

When any of these change, update the projections table at the top and the lever table at the bottom — don't paper over a pricing-model decision with stale cost data.
