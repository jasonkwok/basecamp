# Skills for building Basecamp

Reviewed October 20, 2026 for the Next.js 16.4.2 / React 19.3 project and the map → mountain guide → expedition planner described in `design.md`.

## Core workflow

Use relevant skills throughout implementation, rather than running every skill on every task. Read the selected skill before applying it. Installed package documentation takes precedence over generic examples when APIs differ.

| Area | Skill or reference | When to use it for Basecamp |
| --- | --- | --- |
| Next.js | Version-matched guides in `node_modules/next/dist/docs/` | Before changing routing, server/client boundaries, data loading, caching, metadata, or Route Handlers. Required by `AGENTS.md`. |
| React | `vercel:react-best-practices` — already available | When writing or refactoring components and fetching data; review after changes across multiple TSX components. Focus on avoiding request waterfalls, keeping Mapbox out of unnecessary bundles, and preventing excessive map/list rerenders. |
| AI features | `vercel:ai-sdk` and `vercel:ai-gateway` — already available | When implementing guide chat, catalog tools, structured itinerary output, model access, streaming, limits, and failure handling. Verify APIs against installed SDK docs. |
| End-to-end verification | `vercel:verification` — already available | When starting a dev server or diagnosing broken behavior. Verify the complete user flow, including API responses and persisted data when applicable. |
| Deployment | `vercel:deployments-cicd` and `vercel:vercel-cli` — already available | Before releasing or investigating a deployment. Verify team, project, commit, and environment; follow the production instructions in `README.md`. |

The [old Next.js skills repository](https://github.com/vercel-labs/next-skills) now points to [skills in the Next.js repository](https://github.com/vercel/next.js/tree/canary/skills). Prefer the installed framework's documentation; do not copy canary guidance into this project without checking version compatibility.

## Recommended additions

These are researched recommendations, **not installed by this documentation change**. Check the session's available skill list before claiming a skill is available.

| Skill | Source | Why and when to use it |
| --- | --- | --- |
| Web Interface Guidelines (`web-design-guidelines`) | [Vercel Labs](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md) | Review completed UI for accessibility and interaction quality. Prioritize keyboard map/list navigation, focus in the guide panel, accessible form errors, mobile layouts, and reduced motion. This reviews UI; `design.md` remains the visual direction. |
| React Composition Patterns (`vercel-composition-patterns`) | [Vercel Labs](https://github.com/vercel-labs/agent-skills/blob/main/skills/composition-patterns/SKILL.md) | Use when shared cards, panels, filters, or planner controls develop complicated prop combinations. Apply composition patterns when they simplify real reuse. |
| Playwright (`playwright`) | [OpenAI curated skills](https://github.com/openai/skills/blob/main/skills/.curated/playwright/SKILL.md) | Drive a real browser to verify mountain search/selection, guide recommendations, itinerary editing, packing progress, and recovery from failures. Useful for desktop/mobile checks and console errors. Browser automation does not itself create a persistent regression test suite. |

The [upstream React best-practices skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) overlaps with the Vercel plugin skill already available here. Start with the existing skill rather than installing a duplicate.

## Use as features arrive

- `vercel:vercel-connect`: evaluate Mapbox provider access if we choose Connect. Use Mapbox's official, version-matched docs for map rendering; a generic skill is not a substitute for those APIs.
- `vercel:auth`: when accounts or protected saved trips become requirements.
- `vercel:vercel-storage`: when choosing persistence for plans and conversations.
- `vercel:env-vars`: when provisioning production configuration or credentials.
- `imagegen`: when creating illustrated mountains or guide artwork; preserve the style defined in `design.md`.

Defer durable agent frameworks, queues, and workflows until a concrete requirement needs background execution or resumable work. The initial interactive guide can use the AI SDK and Gateway architecture already described in `design.md`.

## Feature completion checks

1. Read the relevant Next.js docs and feature skills before implementation.
2. Apply the React review to component changes and UI/accessibility review to completed interactions.
3. Run lint and a production build for meaningful application changes. Use browser verification for changed user journeys, including loading, empty, error, keyboard, and mobile states.
4. For AI changes, check catalog IDs, invalid output handling, bounded tool execution, and preservation of user edits when generation fails.
5. Before a requested release, follow `README.md` and verify the production result.

If a recommended skill is unavailable, state that clearly and use the linked authoritative guidance and available tools. Listing a skill in this file does not install it.
