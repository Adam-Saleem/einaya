# ADR-002 — Form Submissions as JSON Snapshots

**Status:** Accepted
**Date:** 2026-05-01

## Context

Doctors build dynamic medical forms (intake, follow-up, condition-specific). Patients fill these forms during consultations. Doctors **edit forms over time** — adding questions, removing options, renaming fields, fixing typos.

The challenge: a consultation from 6 months ago must continue to render exactly as it appeared at submission time, even if the underlying form has been edited since. Otherwise:
- Old visits show new questions that weren't asked → confusing
- Old visits don't show questions that were asked but later deleted → data loss
- Renamed labels rewrite history → audit/legal problem

This is fundamentally a **versioning problem**.

## Options considered

### Option A: No versioning — render from live tables

Just join `form_submissions` to `form_questions` to render historical answers.

**Why we rejected:**
- Edits silently rewrite history
- Deleting a question orphans its answers
- Adding a question shows blank answers in old submissions
- Unacceptable for medical records

### Option B: Full version table (event sourcing-lite)

Every form edit creates a new row in `form_versions`. Submissions reference `form_version_id`.

**Pros:** clean separation of history.
**Cons:**
- 4+ new tables (form_versions, section_versions, question_versions, option_versions)
- Joins for rendering are 4-deep
- Complex code for "duplicate version on edit"
- Versions accumulate forever

### Option C: JSON snapshot at submission time

When a form is submitted, capture the **entire** form structure as a JSON blob on the submission record. Answers also stored as JSON keyed by stable question keys.

**Pros:**
- Single column (`form_snapshot`) holds everything needed to re-render
- Zero joins for rendering history
- Edits to live form don't affect existing snapshots — pure isolation
- Snapshot is self-contained — works even if form is later deleted
**Cons:**
- Some data duplication (form structure repeated in each submission)
- Storage grows linearly with submissions (acceptable — JSON compresses well)
- Cannot easily "fix typo across all old submissions" (acceptable — that's the point)

### Option D: Hybrid (snapshot + reference)

Snapshot the structure but also keep `form_id` reference for grouping/analytics.

**This is what we picked.** Combines option C's isolation with the analytics value of a reference.

## Decision

**Form submissions store a complete JSON snapshot of the form structure at submission time, plus answers keyed by stable question keys.**

### Schema

```
form_submissions
  id
  medical_form_id (reference, for grouping; nullable if form deleted)
  consultation_id, patient_id, doctor_id
  form_snapshot       (JSON) -- full form structure at submission time
  answers_snapshot    (JSON) -- {question_key: answer}
  submitted_at
  timestamps, soft deletes
```

### Stable Keys

Every `form_questions` row has a `key` column — auto-generated from label, editable, unique within form. The key is the **identity** of a question across versions, not its database ID.

Why: if a doctor renames a question's label but keeps it semantically the same ("Do you smoke?" → "Do you smoke cigarettes?"), the key `smokes_cigarettes` stays the same. This means analytics queries like "how many patients smoke" work across all submissions — even old ones — by querying `JSON_EXTRACT(answers_snapshot, '$.smokes_cigarettes')`.

### Single Renderer

A shared `<FormRenderer />` React component renders forms in three modes:
1. Form builder preview (uses live form structure)
2. Live consultation (uses live form structure, captures input)
3. Historical viewer (uses `form_snapshot`, read-only)

This enforces consistency: if rendering changes, it changes everywhere.

## Consequences

**Positive:**
- Historical accuracy is **structural**, not dependent on careful coding
- The "form was edited, did I break old visits?" worry simply doesn't apply
- Renaming/restructuring forms is safe
- Cross-version analytics work via stable keys

**Tradeoffs we accept:**
- Storage: each submission duplicates form structure (typical: 5-50 KB, acceptable)
- "Fix a typo retroactively" not possible without manually updating snapshots (intentional — old visits are immutable records)
- Migrations to add fields to historical structure must walk all submissions (rare — has not been needed)

**Implementation rules:**
- Submissions **never** join `form_questions` to render
- Snapshots are immutable — once written, never updated (soft-delete entire submission if needed)
- The `<FormRenderer />` is the sole source of truth for rendering — no inline form rendering anywhere

**Test that proves this works:**
See `agents/form-builder-agent.md` for the canonical "edit form, verify old submission stays intact" test. This test runs in CI and is non-negotiable.
