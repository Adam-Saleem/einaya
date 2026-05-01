# Conventions

These are the **how-to-write-code** rules for Einaya. Different from the master spec (which sets *what* we're building), these set *how* we write it.

When generating code, AI must follow these. When reviewing code, AI checks against these.

## Index

- [backend-conventions.md](./backend-conventions.md) — PHP, Laravel, Eloquent, services, actions
- [frontend-conventions.md](./frontend-conventions.md) — React, TypeScript, Inertia, hooks, components
- [database-conventions.md](./database-conventions.md) — migrations, naming, indexes, foreign keys
- [i18n-rtl-conventions.md](./i18n-rtl-conventions.md) — translation keys, RTL handling, font selection

## When to update conventions

Add or revise a convention when:
- Multiple files repeat the same pattern → encode it
- A bug class keeps recurring → add a rule that prevents it
- A new tool or library is introduced → document its usage pattern

Don't add conventions for one-off cases. Conventions are for repeated patterns.
