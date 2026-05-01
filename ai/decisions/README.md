# Architectural Decision Records (ADRs)

These document **why** we made each major architectural choice. When you (or AI) wonder "why isn't this done differently?", check here first.

## Format

Each ADR follows this structure:
1. **Context** — what problem are we solving?
2. **Options considered** — what alternatives existed?
3. **Decision** — what we chose
4. **Consequences** — what this commits us to (positives + tradeoffs)

## Index

- [ADR-001 — Multi-Database Tenancy](./001-multi-database-tenancy.md)
- [ADR-002 — Form Submissions as JSON Snapshots](./002-form-snapshots.md)
- [ADR-003 — Insurance Simplified to FK + Policy Number](./003-insurance-simplified.md)
- [ADR-004 — Skip SaaS Billing in v1](./004-skip-billing-v1.md)
- [ADR-005 — Database Queue Driver in v1](./005-database-queue-driver.md)
- [ADR-006 — stancl/tenancy over spatie/laravel-multitenancy](./006-stancl-over-spatie.md)

## When to create a new ADR

Add an ADR whenever you:
- Choose a major package
- Make a non-obvious schema decision
- Decide to deviate from "obvious" implementation
- Reverse a previous decision

Create the file as `00X-short-name.md` and link it in this README.
