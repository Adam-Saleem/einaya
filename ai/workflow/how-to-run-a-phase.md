# How to Run a Phase

Each of the 10 phases in `ai/prompts/` is designed to be run as a single Claude conversation that produces a working slice of the application.

## The procedure

### 1. Prepare your environment
- Make sure you've completed all previous phases
- Pull latest from git
- Verify your dev environment runs (`composer dev` or equivalent)
- Verify all tests from previous phases still pass (`./vendor/bin/pest`)

### 2. Open a fresh Claude conversation
- A fresh chat is important — context window stays clean
- Use Claude.ai or Claude Code (your choice)

### 3. Paste the master spec
Paste the full contents of `ai/00-master-spec.md` as your first message.

This sets the project context. Claude needs this every time. Don't skip it. Don't paraphrase it.

### 4. (Phase 6 only) Paste filled design tokens
For Phase 6 (UI Foundation), also paste the filled `ai/design/tokens-final.md`.

If `tokens-final.md` is still placeholder content (TODOs), pause and fill it from your Stitch screens first.

### 5. Paste the phase prompt
Paste the full contents of `ai/prompts/phase-XX-name.md`.

### 6. Let Claude generate
For complex phases (3, 8, 10), this might take multiple back-and-forth exchanges. Claude may:
- Ask clarifying questions — answer them, refer back to the spec
- Generate files in chunks — let it; ask for missing files
- Suggest deviations — evaluate against ADRs; accept or push back

### 7. Apply the generated code
- Copy generated files into your project
- Run migrations if applicable: `php artisan migrate` and/or `php artisan tenants:migrate`
- Run seeders if applicable: `php artisan db:seed`
- Install any new dependencies: `composer install`, `pnpm install`
- Restart dev server

### 8. Verify Definition of Done
Each phase has a "Definition of Done" checklist at the bottom of its prompt. **Walk through every item.** If any item fails:
- If minor: fix it manually or ask Claude in the same conversation
- If major: revert and re-prompt with the issue described

### 9. Run tests
```bash
./vendor/bin/pest
```

All previous phase tests must still pass. New phase tests should pass too.

### 10. Manual smoke test
Open the app in browser, click through the user flows the phase introduced.

### 11. Commit
```bash
git add .
git commit -m "Phase N: <name> complete"
```

Use one commit per phase, or feature-grouped commits within a phase if it's large. Tag the master spec version if it changes.

### 12. Move to next phase
Open a new fresh conversation and repeat from step 2.

## Common questions

### "The phase generated code is too long for one response."
Ask: "Continue with the remaining files." Claude will pick up where it left off.

### "Claude is missing context I established earlier in the conversation."
Re-paste the master spec at the next message. The context window has limits.

### "I want to deviate from the phase spec."
- If small (e.g. add an extra column, change a label): just do it inline, no ADR needed
- If structural (e.g. swap a package, change architecture): write a new ADR explaining why before proceeding

### "The phase test is failing."
- Read the actual error message before retrying
- Check `storage/logs/laravel.log`
- Use the Debug Agent (`ai/agents/debug-agent.md`) in a fresh conversation to diagnose
- If the test catches a real bug, fix the bug; if the test is wrong, fix the test
- Don't proceed to next phase with failing tests

### "I need to redo a phase."
- Revert via git: `git revert` or `git reset` to before the phase
- Pull master spec + phase prompt fresh
- Re-run

## Time estimates

Rough time per phase, assuming a competent solo developer following along (review + test + integrate):

| Phase | Estimate |
|---|---|
| 1 — Setup & tenancy | 1 day |
| 2 — Central schema | 0.5 day |
| 3 — Tenant schema | 1.5 days |
| 4 — Auth & 2FA | 1 day |
| 5 — Roles & permissions | 0.5 day |
| 6 — UI foundation | 2 days (more if Stitch needs iteration) |
| 7 — Super admin | 1.5 days |
| 8 — Clinic admin + form builder | 3 days (form builder is the big one) |
| 9 — Secretary | 2 days |
| 10 — Doctor consultations | 2.5 days |

**Total estimate: ~15-18 days of focused dev work.** Plan for 4-6 weeks of calendar time accounting for design iteration, debugging, real-world interruptions.

## Tips

- After each phase, write a quick journal entry: what worked, what was confusing, what you'd do differently. Helps the next phase.
- Stuck? Drop into a focused agent conversation (debugging, frontend, etc.) to unblock without polluting the phase conversation.
- Commit early, commit often. Phases are checkpoints; commits are micro-checkpoints.
