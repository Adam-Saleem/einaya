# Workflow

How to operate this `ai/` folder during development.

## Files in this folder

- [how-to-run-a-phase.md](./how-to-run-a-phase.md) — running one of the 10 build phases
- [how-to-use-an-agent.md](./how-to-use-an-agent.md) — using a specialist agent for a focused task
- [troubleshooting.md](./troubleshooting.md) — what to do when things go wrong

## At a glance

```
┌─────────────────────────────────────────┐
│  Initial build (run once, in order)     │
│  ───────────────────────────────────    │
│  Phase 1 → Phase 2 → ... → Phase 10     │
│                                          │
│  Each phase:                             │
│  1. Open fresh Claude conversation       │
│  2. Paste 00-master-spec.md              │
│  3. Paste phase prompt                   │
│  4. Generate code                        │
│  5. Review, test, commit                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Ongoing development                     │
│  ─────────────────────────────────       │
│  • Use agents for focused tasks          │
│  • Reference ADRs and conventions        │
│  • Add new ADRs when making decisions    │
└─────────────────────────────────────────┘
```

## Discipline that pays off

1. **Always paste the master spec first.** Without it, AI loses critical project context.
2. **Run phases in order.** Each builds on the previous.
3. **Don't skip "Definition of Done" checks.** They catch bugs early.
4. **Commit between phases.** Easy to roll back if something goes wrong.
5. **Document deviations in ADRs.** Future you (and AI) will thank present you.
