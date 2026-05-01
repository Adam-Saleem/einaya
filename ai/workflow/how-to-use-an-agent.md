# How to Use an Agent

Agents in `ai/agents/` are specialized AI personas for narrower tasks than what the 10 phases cover. Use them after the initial build, or alongside phases when you hit a focused problem.

## When to use which agent

| Situation | Agent |
|---|---|
| Adding a new backend feature (model, controller, service) | `backend-laravel-agent.md` |
| Building or fixing a React/Inertia component | `frontend-react-agent.md` |
| Tenant context bug, multi-DB issue, subdomain routing | `tenancy-agent.md` |
| Form builder logic, snapshots, submission rendering | `form-builder-agent.md` |
| UI polish, shadcn customization, RTL bug, dark mode bug | `ui-shadcn-agent.md` |
| Writing Pest tests for new or untested code | `testing-pest-agent.md` |
| Debugging an error or unexpected behavior | `debug-agent.md` |

## The procedure

### 1. Open a fresh Claude conversation

Same principle as phases: a fresh chat keeps context clean.

### 2. Paste the master spec

Always. `ai/00-master-spec.md`.

### 3. Paste the agent file

Pick the most relevant one. Paste the full file as a separate message.

### 4. Paste relevant conventions or ADRs (optional but helpful)

If the task touches one of these, include them:
- For backend tasks: `conventions/backend-conventions.md`, `conventions/database-conventions.md`
- For frontend: `conventions/frontend-conventions.md`, `conventions/i18n-rtl-conventions.md`
- For form work: `decisions/002-form-snapshots.md` always, plus `agents/form-builder-agent.md`
- For tenancy: `decisions/001-multi-database-tenancy.md`, `decisions/006-stancl-over-spatie.md`

### 5. Describe your task clearly

Examples of good task descriptions:

> "Add a 'walk-in' flag to the appointments table. Walk-ins should appear in the queue but not on the calendar. Update the booking flow accordingly."

> "When the secretary marks a patient as 'arrived', the queue number should be assigned automatically based on the order of arrivals today. Currently it's null. Fix this."

> "RTL layout in the patient form modal: the buttons in the footer are reversed but the icon inside the button is still pointing the wrong way. Fix."

Bad task descriptions:
- "Help me with patients" (too vague)
- "Build the whole appointment system" (too big — that's a phase, not an agent task)
- "Fix the bug" (which bug?)

### 6. Let the agent work

Agents are more focused than phases. They often produce results in 1-2 exchanges.

### 7. Apply, test, commit

Same as a phase: copy code, run tests, smoke-test, commit with a clear message.

## Combining agents

You generally don't combine agents in the same conversation — it dilutes focus.

If your task spans two areas (e.g. a feature touching both backend and frontend), pick the dominant one and ask the AI to mention boundaries:

> "I'm primarily using backend-laravel-agent. But this feature also touches frontend in `Patients/Show.tsx`. Generate the backend now; for the frontend, just describe what changes are needed and I'll switch to the frontend agent for that."

## Anti-patterns

- ❌ Pasting all the agent files at once (focus collapses)
- ❌ Using an agent without the master spec (Claude loses context)
- ❌ Using a phase prompt for a small task (overkill)
- ❌ Using an agent for a phase-sized task (under-specified)
- ❌ Skipping the test step ("it looks right" isn't enough)

## Tips

- For repeat tasks (e.g. "add a CRUD module like patients but for X"), copy your previous successful prompt and modify
- If an agent's output ignores conventions, paste the conventions file and re-prompt
- If you find yourself fixing the same kind of bug repeatedly, add a rule to the relevant convention file or ADR
