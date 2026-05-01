# ADR-004 — Skip SaaS Subscription Billing in v1

**Status:** Accepted
**Date:** 2026-05-01

## Context

Einaya is a SaaS — clinics pay a monthly subscription. The natural assumption is to wire Stripe/Cashier into v1 so subscriptions auto-bill from day one.

We chose not to.

## Options considered

### Option A: Full billing in v1

Stripe + Laravel Cashier, hosted checkout, webhooks for subscription lifecycle, dunning emails, plan change flows, invoice PDFs.

**Pros:**
- Self-service from day one
- No manual ops to onboard a clinic

**Cons:**
- Stripe doesn't operate fully in Palestine — payment infrastructure here is different (local payment processors, bank transfers, cash agents)
- Wiring Cashier for non-Stripe flows is custom work
- Legal/tax setup adds weeks to launch
- Adds risk of bugs in money-handling code
- Distracts from the core medical product
- Without paying customers, there's no signal yet that billing UX matters

### Option B: Skip in v1, manual ops for early customers

Schema for plans + subscriptions exists (so the data model is ready). Activation/payment is manual: super admin creates the clinic, marks subscription active, optionally extends `ends_at`. Payment collection happens via bank transfer, mobile money, or in-person — outside the app.

**Pros:**
- Ship the medical product faster
- Validate clinic willingness-to-pay with real conversations, not friction-laden checkout
- Local payment integration designed properly later (probably v3) once we know which processors clinics actually use
- Zero risk of money-handling bugs in v1

**Cons:**
- Doesn't scale beyond ~50 customers (manual ops becomes painful)
- Founder has to handle billing personally for early users

## Decision

**We chose Option B.**

### Implementation

In Phase 2:
- `subscription_plans` table fully defined (Starter / Pro / Enterprise + features JSON)
- `subscriptions` table fully defined with status enum
- Plans seeded
- Demo clinic gets a Pro subscription seeded as `active`

In Phase 7 (super admin):
- Plans CRUD UI works
- Subscriptions list is read-only with one action: "Extend ends_at"
- No payment processing UI
- No Stripe integration
- No dunning emails (no email at all yet — see ADR-005)

### Future path

When we hit ~30+ paying clinics:
- Pick a payment integration suitable for Palestine
- Add a billing module that converts manual subscriptions to processor-managed
- Migrate existing subscriptions

The schema is forward-compatible — we just need to add `provider`, `provider_subscription_id` columns and webhooks.

## Consequences

**Positive:**
- v1 ships dramatically faster
- Real customer conversations replace synthetic billing UX testing
- Money-handling complexity deferred until we have the customer base to justify it
- Local payment realities can be researched while clinics are using the product

**Tradeoffs we accept:**
- Founder is on the hook for manual subscription management early
- "Free trial expires" enforcement is manual or via a simple scheduled job that suspends clinics with `ends_at < now()`
- No upgrade/downgrade self-service in v1

**Anti-pattern to avoid:**
Do **not** start adding billing features piecemeal in v2 features. When billing happens, it happens as a coherent module — rate cards, processor integration, invoices, dunning, plan change flows — all together.
