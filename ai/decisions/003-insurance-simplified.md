# ADR-003 — Insurance Simplified to FK + Policy Number

**Status:** Accepted
**Date:** 2026-05-01

## Context

A doctor-owner of an Einaya clinic asked: how do we model patient insurance information? An over-engineered initial design proposed:

- `insurance_provider_id` (FK)
- `insurance_provider_snapshot` (JSON, in case provider is renamed/deleted)
- `insurance_policy_snapshot`
- `insurance_policy_number`
- `insurance_expiry_date`
- `insurance_coverage_type`
- `insurance_card_path` (file)
- `insurance_verification_status` (enum)
- ... etc

This was inspired by full-featured EHR systems (Epic, Cerner) that handle complex multi-payer billing.

But Einaya v1 is for small Palestinian clinics. The actual use case is simpler.

## Options considered

### Option A: Full insurance model (the over-engineered version)

Tracks everything an insurance system might need, including snapshots, verification, expiry alerts, claim status.

**Pros:** future-proof.
**Cons:**
- 80% of fields would be empty for typical clinics
- Most clinics don't process insurance claims — they note coverage and ask the patient to settle with their insurer
- Adds significant UI complexity (forms with many fields)
- Adds maintenance complexity
- Most fields aren't legally required for non-billing operations

### Option B: Simplified — FK + policy number, optionally a card file

Just enough to know:
- Does this patient have insurance?
- With which provider?
- Their policy number (for the doctor to write on receipts/prescriptions if needed)
- A scan of their insurance card (handled via `patient_files` with category `insurance_card`)

**Pros:**
- Matches actual workflow
- Quick to register patients
- Easy to extend later if a clinic actually does need claim processing

**Cons:**
- Doesn't track expiry — clinic must check the card photo if they care
- Doesn't snapshot — if a provider is renamed, all patients show the new name (acceptable: provider names rarely change in this market)
- Doesn't verify — manual

## Decision

**We chose Option B.**

### Schema

On `patients`:
```
has_insurance              boolean default false
insurance_provider_id      foreignId nullable -> insurance_providers
insurance_policy_number    string nullable
```

On `insurance_providers` (per tenant):
```
id
name (unique)
is_active
timestamps, soft deletes
```

Insurance card scans are stored via the existing `patient_files` table with `category = 'insurance_card'`.

### UX

In the patient form:
- Toggle "Has insurance"
- If yes: combobox to pick provider (with "Add new: '...'" option that creates inline)
- Policy number text field
- Drop zone for insurance card scan

That's it. ~3 fields instead of 8+.

## Consequences

**Positive:**
- Patient registration is fast (a primary v1 goal — secretaries handle walk-ins under time pressure)
- Schema is honest about what we actually use
- "Add provider on the fly" works because providers are per-tenant and few in number

**Tradeoffs we accept:**
- No expiry tracking — clinics that need this can extend later
- No insurance verification — Einaya v1 doesn't process claims
- Provider rename affects all linked patients — acceptable for this market

**When to revisit:**
- If a clinic asks for claim processing → proper insurance billing module (likely v3+)
- If insurance fraud becomes a concern → verification fields
- If "show only patients whose insurance is expiring" becomes a request → add expiry column

**Reversibility:** This is highly reversible. Adding columns later is trivial; removing data isn't.
