# AI Agents

These are **specialized prompts** for narrower tasks during development. Use them when:

- You're past Phase 1-10 (initial build) and now refining or debugging
- The 10 phase prompts are too broad for the task at hand
- You want focused, expert-level help on one slice of the project

## How to use an agent

1. Open a fresh Claude conversation
2. Paste `00-master-spec.md` (always)
3. Paste the agent file you need (e.g. `tenancy-agent.md`)
4. Then describe your specific task

The agent file sets the AI's "persona" — tells it what to focus on, what to avoid, and what conventions to follow.

## Available agents

| Agent | Use when |
|---|---|
| `backend-laravel-agent.md` | Writing Laravel-only code (controllers, services, jobs, migrations) |
| `frontend-react-agent.md` | Writing Inertia/React components, pages, hooks |
| `tenancy-agent.md` | Anything multi-database, subdomain routing, tenant context bugs |
| `form-builder-agent.md` | Form builder, snapshots, submissions, dynamic rendering |
| `ui-shadcn-agent.md` | UI work, design tokens, shadcn customization, RTL fixes |
| `testing-pest-agent.md` | Writing Pest tests, especially tenancy isolation |
| `debug-agent.md` | Debugging errors, root cause analysis |

## Tips

- Agents are **additive to the master spec**, not replacements
- One agent at a time — combining them dilutes focus
- If your task spans multiple areas, pick the dominant one and mention the others briefly
