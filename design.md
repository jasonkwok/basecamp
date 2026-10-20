# Basecamp

Status: Initial design direction. This document will evolve as product and visual decisions are refined.

## Product vision

**Basecamp** is an interactive mountain exploration and trip-planning platform that helps adventurers discover their next climb. Explore iconic mountains around the world through a playful, interactive map, get personalized recommendations from an AI mountain guide based on your experience and preferences, and build detailed, day-by-day hiking itineraries. From discovering your next adventure to planning the journey, Basecamp makes mountain exploration accessible, fun, and personalized.

## How agents should use this document

- Treat confirmed requirements as the starting point for implementation.
- Treat proposed details as working defaults, subject to revision.
- Do not treat open decisions as finalized architecture or product requirements.
- Keep the map, guide, and planner connected through shared mountain and trip data.
- Update this document as decisions are made. Follow repository instructions when implementing code.

## Confirmed direction

- The experience should be fun, cartoonish, approachable, and easy to use.
- The initial experience centers on an interactive map of mountains around the world.
- The initial catalog should contain at least 100 mountains, covering iconic and popular destinations worldwide.
- A clickable AI mountain guide helps users find their next mountain based on their experience and preferences.
- An expedition planner helps users create day-by-day hiking itineraries and prepare a packing list.
- Mapbox is the mapping candidate. Investigate using it through Vercel Connect.
- Use Next.js as the application framework.
- Use Vercel's AI tooling for recommendations and trip planning. The recommended initial combination is AI SDK with AI Gateway, as detailed below.

## Core journey

**Explore → Find your match → Plan your expedition**

Users can browse independently or ask the guide for help. Both paths should lead to the same mountain profiles and planner. Chat should be optional: users should be able to discover a mountain and start planning through the interface alone.

## 1. Explore mountains

The initial page is an interactive world map featuring the mountain catalog. Exploration should feel inviting and immediately useful.

Proposed behavior:

- Show distinct mountain markers with clear selected and hover states.
- Select a mountain to open a profile without losing map context.
- Offer search by mountain name and filters for region and relevant trip characteristics.
- Group nearby markers when needed to keep the world view readable.
- Provide a browsable list alongside the map, including a usable fallback if the map fails to load.
- Include a clear action to start planning from a mountain profile.

### Mountain catalog

Use a curated collection of **100+ iconic and popular mountains worldwide**, rather than claiming an authoritative worldwide popularity ranking. Aim for geographic variety.

Proposed core profile:

- Stable mountain ID and name.
- Country or countries and geographic region.
- Latitude and longitude.
- Summit elevation, with units.
- Short description.
- Source links for factual information.
- Optional illustration or image, with attribution where required.

Separate mountain facts from route facts. Difficulty, hiking duration, equipment needs, and suitability depend on the route and conditions; do not assign one universal hiking difficulty to a mountain.

All catalog entries should support exploration. Rich route descriptions and curated itinerary templates may initially cover a smaller subset. Make that coverage visible rather than inventing missing details.

## 2. Find your next mountain

The AI mountain guide opens when users click its entry point. A character or mascot is a possible visual treatment; its identity is undecided.

Proposed behavior:

- Open a chat panel while preserving the user's exploration context.
- Ask concise questions about experience, preferred region, season or dates, available time, and trip preferences.
- Recommend mountains from the shared catalog and explain why they fit.
- Present recommendations as selectable cards linked to mountain profiles and map markers.
- Carry the selected mountain and known preferences into the planner.
- Ask for missing information instead of making unsupported assumptions about route suitability.

Potential agent capabilities:

- Search and filter the mountain catalog.
- Retrieve available mountain and route information.
- Prepare a proposed itinerary or packing list for the user to review and edit.

Recommendations should be grounded in available data. Distinguish general planning suggestions from verified route facts and current conditions.

## 3. Plan an expedition

The planner turns a selected destination into an editable trip plan, including day-by-day activities and packing preparation.

Proposed inputs:

- Mountain and route, where route information is available.
- Dates or season and trip duration.
- User experience and preferences.
- Camping or other overnight arrangements.

Proposed outputs and interactions:

- A trip overview showing the destination and planning assumptions.
- An editable day-by-day itinerary.
- A packing checklist grouped into clothing, equipment, food, and essentials.
- Item quantities, custom items, and packed/unpacked states.
- Visible packing progress.
- Brief explanations for suggested equipment when useful.
- Saved progress; persistence and account requirements remain undecided.

Use curated packing templates as a proposed foundation, with AI adapting and explaining suggestions. Keep generated drafts editable. Do not present a generated itinerary as a verified trail route or as confirmation of current access or conditions.

## Visual and interaction direction

Confirmed qualities: **fun, cartoonish, accessible, and easy to use**.

Proposed visual concept: an illustrated adventure atlas or storybook field guide.

- Soft terrain colors, cream surfaces, forest greens, sky blues, and warm orange accents.
- Illustrated mountain markers, rounded cards, and friendly iconography.
- Clear typography and readable trip information.
- Small, purposeful animations for selection, transitions, and packing progress.
- Playful wording that stays clear about what actions do.

The exact palette, typography, illustration style, mascot, and layout are open decisions. These proposals are starting points, not a finalized design system.

### Usability requirements

- Keep primary actions clear: explore a mountain, ask the guide, and plan a trip.
- Support keyboard navigation, visible focus states, and accessible control labels.
- Do not rely on color or map interaction alone to communicate information.
- Respect reduced-motion preferences.
- Adapt the map, profiles, guide, and planner for smaller screens.
- Preserve user input and planning progress through recoverable errors.

### Important states

- Map loading or unavailable: explain the state and retain access to the mountain list.
- No search results: offer a clear way to reset filters.
- Mountain with limited route coverage: explain what information is available.
- Guide loading or unavailable: show progress or retry controls while keeping manual exploration usable.
- No expedition yet: provide an obvious way to choose a mountain.
- Incomplete planning inputs: identify the missing information before generating detailed plans.

## Technical candidates and constraints

### Next.js

Next.js is the confirmed application framework. The proposed architecture uses the App Router, with interactive map, chat, and planner components on the client and model requests and catalog tools on the server through Route Handlers. Keep model credentials and server-only integrations out of browser code.

Before implementing, read the relevant version-matched guides in `node_modules/next/dist/docs/`, as required by the repository instructions. This document describes architecture intent rather than version-specific API syntax.

### AI SDK and AI Gateway

Recommended initial architecture: **Next.js + Vercel AI SDK + Vercel AI Gateway**.

These products serve complementary roles:

| Layer | Responsibility in Basecamp |
| --- | --- |
| Next.js | Application UI and server endpoints for recommendations and planning. |
| AI SDK | Streaming chat, catalog tool calls, and schema-based generation of recommendations, itineraries, and packing lists. |
| AI Gateway | Model access through a shared endpoint, model/provider routing, usage and cost visibility, and optional configured fallbacks. |

The SDK alone can call providers directly, but Gateway is the recommended model access layer so model selection and usage can be managed consistently. Gateway alone does not provide the application's chat state, catalog tools, or editable planner UI.

#### Recommendation flow

1. The guide collects experience and trip preferences through the chat UI.
2. Server-side catalog tools filter and retrieve matching mountain and route records.
3. The model explains the matches and returns references to catalog IDs.
4. The application validates those IDs and renders cards linked to the map and profiles.

Start with ordinary catalog filtering and retrieval for the 100+ mountains. A vector database is not a prerequisite. Use bounded tool execution rather than an unrestricted agent loop.

#### Planning flow

1. Collect the selected mountain, available route information, dates, duration, and preferences.
2. Retrieve relevant source facts and packing templates on the server.
3. Use schema-based output for a draft containing day entries, packing items, assumptions, and source references.
4. Validate both the output shape and application rules before applying it to the planner. Schema validity does not establish factual accuracy or route suitability.
5. Let users edit the resulting plan. Retain their current plan if generation or validation fails; applying a regenerated draft should not silently overwrite their edits.

Use the same planning service whether the user starts from chat or directly from a mountain profile.

#### Operational defaults

- Start with one configurable model supporting tool calling and structured output; select its exact ID from the live Gateway catalog during implementation.
- Evaluate recommendation quality, planning accuracy, latency, and cost using representative requests before selecting separate models for each feature.
- Keep Gateway authentication server-side using supported Vercel OIDC or a securely stored Gateway API key.
- Bound request size, output size, tool steps, and execution time. Include application-level request limits for public AI endpoints.
- Surface actionable loading, retry, and error states without discarding user inputs.
- Track usage by recommendation and planning feature. Treat model fallback configuration as explicit work, and verify compatible capabilities before enabling it.
- Persistence of conversations and plans is an application responsibility; streaming chat and model routing do not automatically save them.
- Verify implementation APIs against installed, version-matched AI SDK documentation.

### Mapbox and Vercel Connect

Mapbox GL JS is the candidate for rendering and styling the interactive map. It supports custom markers and map styles.

Vercel lists a Mapbox connector, currently marked experimental and unverified. Validate its setup and credential behavior before making it a dependency. Vercel Connect manages provider access; it does not render the map.

Browser map rendering can use a dedicated public Mapbox token with appropriate scopes and URL restrictions. Keep server credentials on the server. Using Connect for server-side Mapbox requests remains an option, subject to validation.

### Eve evaluation

Eve provides a durable agent runtime with sessions and Next.js/React integration. It can complement AI tooling, but adds runtime and deployment concepts beyond the current interactive recommendation and planning requirements.

Recommendation: defer Eve for the initial implementation. AI SDK supplies the chat, tool calling, and structured generation needed for the proposed flows. Reconsider Eve if Basecamp needs background research that survives disconnects, scheduled trip checks, or longer-lived agent work. A clickable guide character does not itself require Eve.

### Shared data

Use stable IDs so map selection, guide recommendations, mountain profiles, and expedition plans refer to the same records. Keep catalog facts, route information, user preferences, and generated trip content distinct.

## Open decisions

- Final visual references, palette, typography, and illustration style.
- Initial map projection, camera position, and desktop/mobile layouts.
- Mountain selection criteria and factual data sources.
- Initial route and itinerary coverage across the catalog.
- Whether to use Vercel Connect for Mapbox access.
- Exact model selection and whether any future durable agent requirements justify Eve.
- Persistence, authentication, and trip sharing or export.
- Whether live weather or access information belongs in the initial experience.

## Technical references

- [AI SDK overview](https://ai-sdk.dev/docs/introduction)
- [AI SDK structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [AI SDK tool calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Custom Mapbox markers](https://docs.mapbox.com/mapbox-gl-js/guides/add-your-data/markers/)
- [Mapbox token management](https://docs.mapbox.com/accounts/guides/tokens/)
- [Mapbox on Vercel Connect](https://vercel.com/connect/mapbox)
- [Eve documentation](https://eve.dev/docs/getting-started)
- [Eve Next.js integration](https://github.com/vercel/eve/blob/main/docs/guides/frontend/nextjs.mdx)
