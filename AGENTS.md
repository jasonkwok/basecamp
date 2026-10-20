<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project skills and implementation workflow

Read `design.md` for product direction and `skills.md` for the project's skill recommendations and feature completion checks.

- Use the available `vercel:react-best-practices` skill when implementing or refactoring React components, and review changes spanning multiple TSX components.
- Use `vercel:ai-sdk` and `vercel:ai-gateway` for guide chat, catalog tools, and itinerary generation.
- Use `vercel:verification` when running the app or investigating failures; verify changed user journeys in a browser when browser tooling is available.
- For UI reviews and reusable component architecture, use the recommended Web Interface Guidelines and Composition Patterns skills when installed. See `skills.md` for upstream sources and availability.
- Use the Vercel deployment and CLI skills for requested releases, following `README.md`.
- Load only skills relevant to the current task. Do not assume recommended skills are installed, and resolve version-specific APIs against installed package documentation.
