# Basecamp

Status: Explorer implemented; trip planner research and proposed architecture updated October 21, 2026. AI planning is not implemented.

Explorer milestone reference: [map explorer checklist](map-explorer-checklist.md). The current catalog contains 70 entries. Next proposed milestone: the form-led trip planner described below; implementation has not started.

Map-specific visual and usability proposals: [map explorer research](map-explorer-research.md), emphasizing a playful storybook atlas and simple exploration controls.

Map explorer implementation direction: use Vercel Connect for Mapbox credentials and a globe-only view. Keep exploration focused on mountain discovery with zoom bounded between the world overview and a regional close-up, plus simplified geography; street-level detail is outside the explorer's scope.

Current explorer styling: coordinated medium forest green (`#3f7055`) for land, the page frame, and branding; mint oceans; cream outlines and labels; rounded Nunito typography; and static star emojis on a uniform twilight-blue sky. Use the mountain emoji logo and slogan “Your next adventure starts here.” Start closer than the widest world view. Keep required Mapbox attribution visible.

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
- An expedition planner will create editable itineraries, cost analyses, and equipment lists, using the traveler’s departure location and intended travel dates.
- Selecting a mountain shows a prominent top-of-page “📝 Plan your [mountain] adventure!” action, opening a mountain-specific WIP modal. AI-powered planning will be integrated in a later milestone.
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
- Show a prominent planning action when an individual mountain is selected. Hide it when the user navigates the map away or opens a group; selecting a peak from that group restores it.

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

Planning research updated October 21, 2026. This section is a proposed implementation plan, not an implemented feature. The current planner is a WIP modal. The confirmed goal is a trip itinerary, cost analysis, and equipment preparation, informed by where the traveler is coming from and their intended dates.

### Entry and planning experience

Start from the selected mountain's “📝 Plan your [mountain] adventure!” action. Keep the selected mountain attached to the draft even if the map selection later changes. Begin with a short form rather than requiring a chat conversation; optional AI follow-up can refine the same plan later.

Proposed journey: **Choose mountain → Trip details → Review assumptions → Generate draft → Edit itinerary, costs, and equipment**.

Use the modal for the initial questions. Once a draft is ready, use a larger planning workspace with Overview, Itinerary, Costs, and Equipment sections. Preserve form answers when moving between steps or recovering from errors. A generated draft needs room for comparisons and edits beyond the current WIP modal.

### What to ask before generation

| Input | Proposed requirement | Purpose |
| --- | --- | --- |
| Mountain and trip objective | Required; mountain prefilled | Distinguish a summit ascent from a base-camp trek, viewpoint hike, or visit. Selecting Everest must not silently imply attempting its summit. |
| Departure location | Required city and country; airport optional | Plan the journey from home to the destination gateway and trailhead. Resolve ambiguous city names before generation. An exact home address is unnecessary. |
| Travel dates | Required departure-from-home date and return-home date for a dated plan | The window includes international travel, transfers, mountain days, and the journey home. Ask separately if the user means arrival dates at the destination. |
| Flexibility | Optional number of days either side | Explain alternative date windows; do not move a fixed window without asking. |
| Party size | Required, with one traveler as an explicit editable default | Separate per-person charges from shared guides, rooms, vehicles, and equipment. First version targets adults; add child-specific pricing only with appropriate data. |
| Experience | Required broad hiking, altitude, and technical experience | Identify route mismatches and missing support needs. Do not infer technical competence from general fitness. |
| Trip style | Required guided/self-guided preference and camping/lodge/hotel preference; “help me decide” allowed | Determine logistics, accommodation, inclusions, and gear. Route-specific requirements override unsupported preferences. |
| Budget and currency | Currency required; budget optional with “not sure yet” | Ask whether the budget is per person or whole party, and whether international travel and equipment purchases are included. |
| Equipment already owned | Optional grouped checklist | Avoid budgeting for purchases the traveler does not need; distinguish owned, buy, rent, and operator-provided items. |
| Other preferences | Optional pace, dietary, accessibility, and comfort preferences | Adapt the plan without collecting medical histories or unnecessary personal information. |

For users without exact dates, allow an explicit **rough planning mode** using a month/season and total available days. Mark its timeline and costs as provisional; require concrete dates before requesting date-specific transport or lodging offers. Do not invent dates or a departure city.

Ask only relevant follow-ups. Route choice should come from supported route records; offer “recommend a suitable route” when several exist. If essential details are missing, return questions instead of a superficially complete plan.

Before generation, show a compact summary: origin, destination/objective, dates, travelers, route or route-selection assumption, budget scope, and included cost categories. Make corrections possible without restarting.

### Itinerary output

Produce an editable door-to-door itinerary covering outbound travel, destination transfers, preparation, route days, rest/acclimatization where supported by the route template, contingency time, and return travel. Keep travel days distinct from hiking days.

Each day should contain its date, local timezone when relevant, day type, start/end location, activities, overnight arrangement, meals/inclusions, linked cost items, and relevant source IDs. Distances, elevation gain, sleeping altitude, and hiking duration are optional sourced fields; use “unknown” when the route data does not support them.

Check that the proposed route fits the travel window, transit time, supported season, and experience level. When it does not fit, explain the conflict and offer a different objective, route, or date window. Do not shorten a curated acclimatization schedule to force a fit. Technical expeditions without vetted route coverage receive a logistics overview and questions for an operator, rather than fabricated day-by-day climbing instructions.

Seasonal expectations must be labeled as seasonal guidance. Future dates do not imply an available weather forecast, open trail, issued permit, or reserved accommodation. Show specific verification tasks alongside the affected day.

### Cost analysis

Show a **low–high planning range**, a category breakdown, the full party total, and an average per person. A range is a scenario estimate, not a statistical confidence interval or a guaranteed quote. Label incomplete totals as partial and list unpriced categories beside them.

Include international transport, destination transfers, accommodation, food, permits/park fees, guides/porters/operator packages, equipment rental or purchase, insurance allowance, and other explicit expenses. Show optional activities and a user-adjustable contingency separately. Explain which categories dominate cost and what changes would reduce it.

Use structured line items with: category, description, quantity, unit (night/day/person/group/item), low/high unit amount, currency, shared or per-person basis, inclusion status, source ID, price date, and assumptions. A retrieved offer also needs its provider reference and expiry when supplied.

**Calculate totals in application code.** Multiply quantities and allocate shared charges deterministically; use decimal-safe arithmetic or currency minor units. Convert using a dated exchange-rate source, retain original currencies, and show the conversion date. Missing FX data must leave separate currency subtotals rather than invented conversions. Do not multiply a whole-party quote by party size again.

Avoid counting the same expense twice: an operator package may already include meals, permits, lodging, and transfers. Owned equipment has no new purchase cost; keep optional replacement purchases separate. Insurance is an allowance pending an actual policy covering the objective, rather than a promise of coverage.

Proposed initial release uses maintained cost ranges and official published fees with source dates. Flight or lodging costs without a defensible source remain unpriced, or can be entered by the user. AI must not invent fares, availability, or purchase links. User-entered amounts are labeled as such and retained during regeneration.

A later release can add live travel providers behind adapters. For example, [Duffel offers](https://duffel.com/docs/api/v2/offers) have expiry timestamps, and its [offer schema](https://duffel.com/docs/api/offers/schema) documents that amounts can change when refreshed. This supports treating retrieved prices as time-limited observations. Provider choice still needs a separate coverage, access, commercial-terms, and cost assessment. No booking, payments, or automatic purchasing in the initial scope.

### Equipment output

Start with maintained packing templates tied to the **route, season, overnight style, and operator inclusions**. AI adapts quantities and explanations to the itinerary and party; it must not choose technical equipment solely from summit elevation.

Group items into clothing/layers, footwear, shelter/sleeping, food/water/cooking, navigation/communications, personal essentials, and route-specific technical equipment. Each item includes quantity, per-person/shared basis, reason, required/recommended/conditional status, owned/buy/rent/operator-provided status, optional linked cost item, and packed state.

Support custom items, edits, and visible packing progress. Explain conditional requirements and identify gear that needs operator confirmation or specific training. Adding an item to a checklist does not establish that the traveler can safely use it. Keep equipment purchase/rental changes synchronized with the cost view without another model call.

### Sources, assumptions, and edits

Use visible evidence labels: **curated source**, **retrieved price**, **user supplied**, and **planning assumption**. Source references need stable IDs, URLs, retrieval dates, and the claim or price they support. Resolve IDs against server-retrieved records; do not accept model-invented URLs as evidence. Track missing information explicitly rather than using a vague confidence score.

The user can edit itinerary days, quantities, budget amounts, equipment, and assumptions. Changing dates, route, origin, or party size marks affected content as needing review. Regeneration produces a proposed revision with a change summary; applying it requires an explicit action and preserves user-owned edits and packed states. Cancelling or failing generation leaves the last valid draft intact.

Proposed first version keeps the current draft through modal closure and navigation within the planner. Durable saving across reloads, accounts, sharing, and export remain separate product decisions; do not imply a plan is saved until storage exists.

### Scope and rollout

1. **Planning contract and coverage:** define form/output schemas, route templates, cost bases, packing templates, source metadata, and unsupported-route behavior. Start with a small explicitly documented set of supported routes; the 70-entry mountain catalog is not equivalent to detailed route coverage.
2. **First working planner:** form-led inputs, server-side generation through AI Gateway, editable itinerary/cost/equipment views, deterministic calculations, citations, cancellation/retry, and review before applying revisions. Use maintained estimates; identify unknowns.
3. **Current travel data:** evaluate and add departure-location resolution, flight/lodging/FX adapters, and bounded source research where it improves the plan. Keep estimates usable when a provider is unavailable. Assess licensing, credentials, coverage, and ongoing request cost before selecting integrations.
4. **Refinement and persistence:** optional conversational revisions using the same planning service, durable saved plans, sharing/export, and targeted refresh of outdated cost items.

No implementation, dependency installation, model requests, credential creation, or provider provisioning is authorized by this research update.

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

Research reviewed October 21, 2026 against current official documentation. The repository currently has neither `ai` nor `@ai-sdk/react` installed. Choose and verify the stable package version and Node.js requirements during implementation; the latest documentation currently describes AI SDK 7. This plan does not pin a model or copy version-specific sample code into the application.

Recommended architecture: **Next.js App Router + AI SDK + AI Gateway**, with a form-led planner and an application-controlled generation pipeline.

| Layer | Responsibility in Basecamp |
| --- | --- |
| Next.js client UI | Input steps, progress, editable plan sections, and revision review. Keep planner state separate from the map lifecycle. |
| Next.js server service | Validate requests, load catalog/route context, retrieve evidence, calculate costs, validate generated plans, and enforce limits. |
| AI SDK | Model calls, schema-constrained output, optional bounded tools, and streaming. |
| AI Gateway | Model access, provider routing/fallbacks, authentication, and AI usage/spend visibility. |
| Data adapters and maintained records | Route facts, published fees, packing templates, travel prices, and exchange rates with provenance. |

AI SDK and Gateway are complementary. Gateway does not itself supply a flight/hotel inventory, itinerary database, plan storage, or cost calculator. Its model-request costs are separate from the travel costs shown to users. [Gateway getting started](https://vercel.com/docs/ai-gateway/getting-started) explains its model access layer.

#### Proposed server flow

1. Accept a typed planning request through a POST Route Handler, proposed as `/api/trip-plans`. Validate mountain/route IDs, resolved origin, dates, party size, currency, field lengths, and supported trip scope before calling a model. Use a client request ID to deduplicate repeated submissions.
2. Load the canonical mountain and vetted route context on the server. Check objective, route coverage, season, and duration constraints. Return missing questions or an unsupported-route result when needed.
3. Retrieve applicable published fees, maintained cost ranges, packing templates, and any enabled live-data observations. Fetch independent sources concurrently with per-source deadlines. Build an evidence bundle with source IDs and explicit missing fields.
4. Use AI SDK structured output for the itinerary, explanations, proposed packing changes, assumptions, and references to evidence/cost records. Keep calculation inputs grounded in retrieved records. Do not ask the model to research, schedule, invent prices, and compute final totals in one unconstrained prompt.
5. Validate the full output, including valid source IDs, date coverage, route constraints, quantities, and inclusions. Recalculate cost totals and equipment-derived expenses in application code. Produce either `ready`, `needs-input`, or `limited-coverage`, with a separate recoverable error path.
6. Return a validated draft with input/source/template versions and the generation ID. Show incomplete areas explicitly. Preserve the prior draft until a successful result is reviewed and applied.

Use the same server service for direct planning and later guide-chat requests. Do not maintain separate itinerary prompts or schemas for each entry point.

#### Structured generation and streaming

Current AI SDK documentation uses `generateText` or `streamText` with `Output.object()` for schema-constrained data. Use a shared runtime schema, such as Zod, for client/server contracts. A matching schema validates shape, not travel accuracy. [Structured-output reference](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data).

Start with server-side `generateText` and explicit progress stages: validating inputs, gathering sources, drafting itinerary, checking costs/equipment. This makes it easier to publish only a validated plan. If measured latency warrants progressive previews, use `streamText` and a version-compatible object/data-stream client. Streamed partial objects are incomplete and must not replace the valid plan until full validation succeeds. [Object-generation UI](https://ai-sdk.dev/docs/ai-sdk-ui/object-generation) and [custom status streams](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data) describe the available UI transports. A chat UI and `useChat` are optional later features.

#### Proposed data contracts

| Contract | Key fields |
| --- | --- |
| `TripPlanningInput` | Mountain/objective/route IDs, resolved origin, exact or rough date mode, party size, experience, travel style, currency, budget scope, owned gear, preferences. |
| `PlanningEvidence` | Route/template versions, source records, cost observations and inclusions, original currencies/FX date, timestamps, missing facts. |
| `TripPlanDraft` | Schema version, input snapshot, overview, dated/localized itinerary, equipment items, cost-item references, assumptions, unresolved questions, evidence IDs. |
| `TripCostSummary` | Server-calculated category ranges, party and average per-person totals, contingency, missing categories, original currency/FX metadata. |
| `PlanRevision` | Base draft version, proposed changes, preserved user overrides, affected sections, and accepted/rejected state. |

Assign stable IDs to days, equipment, costs, and sources. Separate generated suggestions from user edits. Derived totals and packing progress should update immediately without invoking AI. Plan transport must reject stale generation responses after newer inputs or a different mountain have been selected.

#### Tools and external research

Prefer deterministic application retrieval for facts already known from form inputs. If adaptive research is needed, expose only narrow, read-only tools such as route lookup, approved-source search, transport estimates, and equipment-template lookup. Validate tool inputs and outputs and restrict catalogs, result sizes, domains, and timeouts.

AI SDK supports schema-defined tools and bounded multi-step calls; verify the installed version's loop-limit API when implementing. Use its built-in loop/agent facilities if adaptive tool execution is introduced, rather than hand-rolling an unbounded loop. Reserve a separate final generation step so a research limit cannot consume the entire budget before a structured plan is produced. [Tool-calling reference](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling).

Gateway offers provider-independent search tools, including Perplexity and Parallel, with source filtering options. Proposed use: a bounded research phase that prioritizes park authorities, official permit sources, and named operators. These tools can improve freshness but do not establish bookable inventory or factual correctness. Select one search approach after testing source quality, costs, and coverage; search is not required for every draft. [Gateway web search](https://vercel.com/docs/ai-gateway/models-and-providers/web-search).

Treat retrieved pages as untrusted data, never as instructions. Allow only supported retrieval targets; protect server fetches from arbitrary URLs and private-network access. Verify source IDs and use safe text rendering for generated content.

#### Model selection and routing

Use one configurable primary model initially. During implementation, inspect the live Gateway catalog and benchmark candidates for structured-output reliability, grounded itinerary quality, latency, and total request cost. Evaluate short hikes, multi-day treks, and unsupported expedition cases rather than selecting only by a model's leaderboard position. No exact model is selected by this document.

Test a compatible fallback against the same schema, tool availability, grounding rules, and quality gates. Provider fallback for the same model and fallback to a different model are separate choices. A successful model response with incorrect travel content is not repaired by availability failover. Log the actual model/provider used. [Provider routing and fallbacks](https://vercel.com/docs/ai-gateway/models-and-providers/provider-options).

#### Authentication, spend, and recovery

- Keep Gateway and travel-provider credentials server-side. Prefer Vercel OIDC in deployments and linked development; use `AI_GATEWAY_API_KEY` where OIDC is unavailable. Verify credential precedence and refresh behavior against the chosen SDK/runtime. [OIDC authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc).
- Validate public requests and apply application-level rate/concurrency limits before expensive retrieval or model calls. Allow cancellation; propagate aborts and use bounded retry and repair attempts.
- Configure project/key spend controls before launch. Gateway budgets are soft caps checked at request start, so they complement application limits rather than guaranteeing a strict per-request spending ceiling. [Gateway budgets](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets).
- Handle invalid inputs, absent sources, provider failure, budget exhaustion, invalid structured output, timeouts, and disconnected clients distinctly. Never silently replace missing transport prices with plausible numbers. A failed generation must preserve the input and previous draft.
- Cache public route/templates independently of personalized requests. Cache expiring offers only within provider terms and expiry; never share a personalized plan across users. Reuse evidence for targeted revisions only while it remains applicable and fresh.
- Record request ID, prompt/schema/template version, model/provider, latency, tool count, validation outcome, and AI/search cost where available. Use pseudonymous reporting IDs; do not place origin, exact travel dates, or personal preferences in tags. Review Gateway/provider logging and retention before enabling production traffic. [Gateway observability](https://vercel.com/docs/ai-gateway/observability-and-spend).
- Exclude unnecessary personal information from prompts. Passport data, payment details, and exact home addresses are outside the initial planner. Persistence, access control, deletion, and retention need explicit design before adding saved plans.

#### Completion criteria for the first implementation

Verify the complete flow from individual mountain selection through form, server generation, and all three editable outputs. Include these cases:

- Same-name departure cities, missing origin, invalid/reversed dates, timezone-crossing travel, rough date mode, and an unrealistically short window.
- A supported route, no route coverage, experience mismatch, and dates outside documented route coverage.
- One traveler versus a party, shared costs, bundled operator inclusions, owned/rented gear, mixed currencies, missing FX, and unknown/expired prices. Totals must reproduce exactly from line items.
- Missing or fabricated source IDs, malformed model output, tool failure, cancellation, duplicate submissions, stale responses, and bounded fallback/retry.
- Date/party/route changes after editing, equipment-to-cost synchronization, packed-state preservation, mobile use, keyboard focus, and accessible validation errors.

Use AI SDK test mocks for predictable request/error paths, plus a small reviewed evaluation set for grounding, feasibility, completeness, and clarity. Record latency and cost from an authorized live pilot before setting production targets. [AI SDK testing](https://ai-sdk.dev/docs/ai-sdk-core/testing). No paid pilot is part of this documentation task.

### Mapbox and Vercel Connect

Mapbox GL JS is the candidate for rendering and styling the interactive map. It supports custom markers and map styles.

Vercel lists a Mapbox connector, currently marked experimental and unverified. Validate its setup and credential behavior before making it a dependency. Vercel Connect manages provider access; it does not render the map.

Browser map rendering can use a dedicated public Mapbox token with appropriate scopes and URL restrictions. Keep server credentials on the server. Using Connect for server-side Mapbox requests remains an option, subject to validation.

### Eve evaluation

Eve provides a durable agent runtime with sessions and Next.js/React integration. It can complement AI tooling, but adds runtime and deployment concepts beyond the current interactive recommendation and planning requirements.

Recommendation: defer Eve for the initial implementation. AI SDK supplies the chat, tool calling, and structured generation needed for the proposed flows. Reconsider Eve if Basecamp needs background research that survives disconnects, scheduled trip checks, or longer-lived agent work. A clickable guide character does not itself require Eve.

### Shared data

Use stable IDs so map selection, guide recommendations, mountain profiles, and expedition plans refer to the same records. Keep catalog facts, route information, user preferences, and generated trip content distinct.

## Current catalog iteration

- 70 unique entries: the Seven Summits (Messner/Oceania list), 14 classic eight-thousanders, and 50 additional curated popular destinations. Everest is one record with two badges.
- Large brown, snow-capped illustrations, prominent name labels, and extensible category badges.
- Canonical records in `app/data/mountains.json`, validated by `app/data/mountains.ts`; category definitions in `app/data/mountain-tags.ts`. Profiles show elevation, coordinates, a short blurb, sources, and an editorial rating tied to an ascent context.
- Profiles include editorial trip length ranges in days or approximate months, with the named route and itinerary assumptions. Difficulty and altitude info buttons open field-guide modals with level explanations and the current level highlighted. Machu Picchu is a destination with site elevation, distinct from Huayna Picchu.
- Overlapping illustrations group by screen footprint. Open a group to browse its peaks; choosing one centers its actual location and makes it the visible representative. The cluster remains browsable at the regional zoom limit.
- Difficulty bands are Beginner 🌱, Intermediate 🥾, Difficult 🧗, Expert 💀, and Extreme ☠️. Ratings describe the specified ascent rather than all activity on a mountain. The picker supports text search and combined tag, difficulty, elevation, and region filters; each result shows its tags and ascent difficulty. Profiles are available; detailed routes, guide chat, and planning remain later iterations.

## Open decisions

- Final visual references, palette, typography, and illustration style.
- Initial map projection, camera position, and desktop/mobile layouts.
- Mountain selection criteria and factual data sources.
- Initial route and itinerary coverage across the catalog.
- Whether to use Vercel Connect for Mapbox access.
- Exact model selection and whether any future durable agent requirements justify Eve.
- Persistence, authentication, and trip sharing or export.
- Initial supported routes and source-maintenance ownership; unsupported catalog entries remain discoverable.
- Initial estimate coverage, live flight/lodging/FX providers, access terms, and freshness policy.
- Whether optional bounded source research ships in the first planner or follows maintained estimates.
- Budget/default currency, adult-only party scope, and maximum supported trip duration.
- Whether live weather or access information belongs in the initial experience; seasonal guidance must remain distinct from live conditions.

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
