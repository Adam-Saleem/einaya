# Einaya — AI Workflow Folder

This folder is the **single source of truth** for how AI assists the development of Einaya. It contains prompts, specialized agents, architectural decisions, conventions, and design references.

> **Product:** Einaya (عناية) — Multi-tenant SaaS for medical clinics in Palestine
> **Domain:** einaya.ps
> **Stack:** Laravel 12 · Inertia · React + TS · Tailwind · shadcn/ui · stancl/tenancy

---

## Folder Map

```
ai/
├── 00-master-spec.md          ← The shared context. Paste at top of every prompt.
│
├── prompts/                    ← The 10 build phases, run in order.
│   └── phase-01 to phase-10
│
├── agents/                     ← Specialized AI personas for narrower tasks.
│   └── backend, frontend, tenancy, form-builder, ui, testing, debug
│
├── design/                     ← Stitch outputs + design tokens.
│   ├── tokens-worksheet.md     ← Blank template
│   ├── tokens-final.md         ← Filled tokens (extract from your Stitch screens)
│   ├── stitch-screens/         ← Drop Stitch HTML/CSS exports here
│   └── stitch-screenshots/     ← Drop PNG screenshots here
│
├── decisions/                  ← Architectural Decision Records (ADRs).
│   └── 001 to 006
│
├── conventions/                ← Code conventions Claude must follow.
│   └── backend, frontend, database, i18n-rtl
│
└── workflow/                   ← How to operate this folder.
    ├── how-to-run-a-phase.md
    ├── how-to-use-an-agent.md
    └── troubleshooting.md
```

---

## Quick Start

1. **Read** `00-master-spec.md` — understand the project context.
2. **Read** `workflow/how-to-run-a-phase.md` — understand the process.
3. **Run Phase 1:**
   - Open a fresh Claude conversation.
   - Paste the contents of `00-master-spec.md`.
   - Paste the contents of `prompts/phase-01-setup-tenancy.md`.
   - Review and run the generated code.
4. **Verify** the phase's "Definition of Done."
5. **Commit** your code.
6. **Move to Phase 2.** Repeat.

---

## Important Rules

- **Always paste the master spec at the top of every prompt.** Without it, Claude loses critical context.
- **Run phases in order.** Each phase builds on the previous.
- **Don't blindly accept generated code** — read it, understand it, test it.
- **Document any deviation** in `decisions/` as a new ADR.
- **Drop Stitch designs into `design/stitch-screens/`** before running Phase 6.

---

## Version Control

This folder is tracked in git. When AI generates new code or you make architectural decisions, update the relevant files here so the next AI session has the correct context.

---

## License & Confidentiality

This folder is part of the Einaya project repository. Treat it as confidential — it contains the full architectural blueprint of the product.
