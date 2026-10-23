# Basecamp design

This is the single product and technical design reference for Basecamp. It records the current codebase separately from proposed work so that roadmap ideas are not mistaken for shipped behavior.

## Product purpose

Basecamp helps people explore mountains, find a suitable next objective, and create an initial trip plan. The experience combines an illustrated world map, an optional AI mountain guide, and a mountain-specific itinerary planner. The product should feel approachable and playful while being candid about route coverage, estimates, and safety limitations.

## Current product

### Explore

- The home page opens an interactive Mapbox globe centered on the United States. The map uses a forest-green land palette, mint-blue water, cream borders and labels, mountain illustrations, and a twilight-blue sky. The page sits inside a softened dark-brown frame.
- Mapbox attribution remains visible. Custom zoom and world-view buttons are not part of the interface. Users navigate the map directly.
- The catalog contains 100 mountain and trekking-destination records. There are seven named mountain-range groupings. Cluster labels show the range name and the number of catalog peaks; opening a group lists its individual mountains.
- Search, nearby-peak groups, and mountain-range panels share the wider responsive Field Notes scale, capped at 520px on larger screens. Peak results scroll independently under a fixed group header, including with keyboard and touch.
- Clicking a peak group or mountain range centers its peaks and moves in 0.75 zoom levels, capped at the map limit. Closing its panel backs out 0.75 levels, respecting the minimum zoom. Camera movement respects reduced-motion preferences.
- Search filters the shared catalog by text, region, tag, editorial difficulty, and elevation. Selecting a result opens its map profile; a back action returns to search. Closing a profile closes it rather than reopening a prior group.
- Field Notes scales from a 400–520px desktop panel to the available compact viewport, with one scrollable body and a sticky close/back bar. Compact layouts keep the inline trip action and reserve space for the guide launcher; short landscape windows allow a taller panel with scroll clearance for the launcher.
- Profiles include location, elevation, description, badges, source links, ascent difficulty, editorial trip-length context, and a per-person USD planning range. Difficulty is tied to a named ascent and is not a certification or current-condition report.
- A selected individual mountain can show “Plan your [mountain] adventure!” near the top of the page and a compact “Plan trip” action by “Summited?”. The prominent action hides when the map moves away from the selected mountain, a group is selected, or the guide is open.
- “Summited?” records progress in browser session storage without an account. The top-right summit list opens when a mountain is marked, retains its catalog badges, links back to that mountain, and allows removal.

### Mountain guide

- The “Find your next mountain” hiking-boot button stays visible whenever the guide is closed, including while a mountain profile, search, or nearby group is open. The open guide keeps that title in its header. The guide stays available while the traveler searches for or opens mountains. The guide opens independently, preserving the current profile, search, peak group, trip action, and back-navigation state. Browsing search results or selecting mountains does not close the guide; its own close control does. Search still replaces other catalog panels.
- The guide asks the traveler to choose an experience level before making a recommendation. Its levels range from beginner through day-hiking, multi-day trekking, high-altitude, non-technical high-altitude summits, technical mountaineering, and expert expeditions. It does not infer experience that the traveler has not supplied.
- The guide learns the traveler’s overall goal, background, training commitment, next-trip time, region, desired skills, and altitude target through concise questions, one at a time. Marked summits supply known climbing history and an altitude baseline, so the guide does not ask travelers to repeat that information; route, recency, and acclimatization remain unknown unless shared. Unknown preferences and skipped discovery are accepted. Long-term ambitions stay separate from next-trip constraints.
- A follow-up changing a filter replaces that dimension while preserving unrelated preferences. Direct location searches such as “any ones in Nepal?” replace the old area and search again, even after a stale empty response. Previously shown matches can be reconsidered for a changed location; explicit requests for new options still exclude repeats.
- Each generation reconstructs structured current preferences from the full conversation, distinguishing soft preferences, explicit firm requirements, and relaxed constraints. Soft location, summit altitude, and summit duration mismatches lower ratings with explicit tradeoffs; firm requirements filter matches. No-match replies identify remaining blockers rather than asking to relax a preference already cleared.
- The guide returns zero to five ranked alternatives, each with a Low, Medium, Strong, or Very strong match rating and a concise reason. It explains when no match fits; application checks remove unsuitable options without padding the list or interrupting discovery.
- Recommendations come from the shared catalog, are filtered by application-level suitability rules, and are selectable back into the map. Location requests are treated as constraints; follow-ups such as asking for a different region should update the options rather than repeat the prior set.
- When application checks remove every suggestion, the guide searches for eligible next climbs and makes one bounded rematch using the full conversation and unchanged preferences. Marked summits are hard exclusions from initial recommendations, rematches, fallback options, displayed cards, and recommendation downloads. Cards are hidden immediately when a summit is marked, including when a response was already in flight. Completed climbs are excluded; previously shown suitable climbs remain available unless the traveler explicitly asks for new options. Recommendation intent is explicit, so an empty difficulty warning also triggers recovery. An empty generic retry cannot suppress checked cards. If no summit fits, named trekking destinations may be shown as clearly labeled alternatives when firm altitude and duration requirements do not rule them out. If generation fails, checked catalog alternatives remain available; genuinely impossible firm requirements receive a specific explanation.
- The guide can provide progressive training objectives when a requested summit is beyond the selected experience. It does not provide technical climbing instructions or claim that a recommendation certifies safety.
- The conversation and recommendation options can be downloaded as Markdown. The conversation is not saved across reloads.

### Trip planner

- The planner asks for objective, party size, experience, and timing. Timing can be recommended or a season/months, with optional total days. Exact travel dates are not presented in the form. It does not ask where the traveler is coming from or plan travel from a home city.
- Experience selected in the guide is carried into the planner and can be changed there. Opening a planner directly defaults the experience to beginner.
- A server Route Handler validates the request and applies suitability checks before paid generation. An unsuitable beginner Everest summit request receives a strong warning and no ascent schedule. This policy is a conservative product guard, not a safety assessment.
- Every mountain uses concise route stages with a stage-specific difficulty and altitude movements. Elevation changes are calculated from sourced named endpoints; unsupported elevations are cleared rather than guessed. Missing elevation data is explained once per itinerary; stage cards show known elevations and calculable changes without repeated unavailable labels. A climb-and-return is displayed as separate uphill/downhill movements. Detailed camp coverage is currently maintained for Everest; other mountains retain known summit elevations and explicit gaps.
- Equipment is limited to route-specific climbing gear (such as poles, ice axes, crampons, harnesses and rope systems), filtering out clothing, camping and general travel supplies in the result and export. Duplicate core items are removed. Equipment appears after the itinerary with up to ten must-have items previewed and the remaining kit collapsed by default. Budget and planning notes are also collapsed.
- AI-generated itineraries contain either numbered daily stages or multi-day expedition phases, with activities, overnight context, altitude, temperature, conditions, and movement-time ranges or supported route timings. Expedition phases cover contiguous days. The schema supports trips up to 120 days, up to 21 daily entries, and up to 20 phases.
- Field Notes provides every catalog entry a per-person USD planning range and explains its basis and exclusions. This is an editorial planning allowance, not a complete cost analysis, a live quote, or a personalized total. The form does not ask for a budget or currency.
- Equipment output is generated from a shared catalog preparation baseline plus route-specific references and AI suggestions. The interface emphasizes “Must have” and “Important to have”; the optional “Nice to have” group remains in the data contract but is not displayed. Everest summit plans have a dedicated South Col reference. Equipment lists are not complete operator checklists.
- Critical warnings suppress scheduled days and equipment suggestions until the plan changes. Drafts can be downloaded as Markdown. Email export, editable cost line items, durable saved plans, and revision merging are not implemented.

## Data and domain model

- `app/data/mountains.json` is the source of truth for the map catalog. `app/data/mountains.ts` validates records and exports a discriminated `Mountain | Destination` model as `MountainCatalogEntry`. Destinations such as Machu Picchu remain distinct from climbing mountains while sharing common geographic and planning fields.
- Catalog tags and editorial difficulty bands are defined in `mountain-tags.ts` and `difficulty-levels.ts`. Route timing references, mountain-range groupings, and budget allowances live in separate data modules so they are not confused with generated itinerary content.
- Trip request and itinerary contracts are Zod schemas in `app/lib/trip-planner/schema.ts`; TypeScript types are inferred from those runtime schemas. The mountain-guide request and recommendation contracts are defined in `app/lib/mountain-guide/schema.ts`.
- Generated model output is validated and adjusted by server-side suitability, route-timing, equipment, and itinerary-validation code before it reaches the UI. The model is not the source of catalog facts or maintained route references.
- Summit history uses session storage only. There is no account system or persistent trip-plan storage.

## Code organization

- `app/components/map-explorer/` composes the map UI. Its `chrome/`, `map/`, `mountain-guide/`, `mountain-profile/`, `mountain-selection/`, and `summit-progress/` directories separate the major explorer features.
- `app/components/trip-planner/` contains the planner entry points and shared state, with `form/`, `itinerary/`, and `result/` directories for its main stages.
- `app/data/` contains the shared catalog and maintained reference data. `app/lib/` contains server-side AI, validation, suitability, and generation logic. `app/api/` contains the map configuration, mountain guide, and trip planning Route Handlers.
- `tests/` covers catalog-driven planning, route timing, recommendation policy, map camera behavior, mountain ranges, and session summit history.

## Runtime and limits

- The application uses Next.js App Router, React, TypeScript, and Mapbox GL JS. AI features use AI SDK and Vercel AI Gateway. Model credentials remain server-side; Mapbox Connect returns only the public browser token.
- `/api/mountain-guide` handles conversational recommendations; `/api/trip-plans` handles itinerary generation; `/api/map-config` provides map configuration.
- AI request limits are best-effort, in-memory limits of 100 guide replies and 50 trip drafts per hour per IP per running instance. They are not shared across instances and need shared storage before broader public use.
- `TRIP_PLANNER_MOCK=success|error|invalid` provides development-only itinerary fixtures without AI calls. The mock flow keeps request validation and suitability checks active.
- The planner and guide do not verify live weather, permits, access, guide availability, or bookable travel prices. Route timing references currently cover selected Everest, Gasherbrum II, Annapurna I, and Mount Washington movements; other movement ranges are planning estimates.

## Visual and interaction direction

Typography uses four shared sizes: 16px labels, 18px body text, 24px section headings, and 36px titles, defined as rem-based CSS tokens. Guide and search titles use the largest size. Mobile layouts wrap or stack content instead of reducing text size. Use weight, spacing, and color for hierarchy within each size.

Keep the illustrated atlas identity: large snow-capped mountain markers, Nunito typography, forest-green branding, mint water, cream surfaces, and a brown application frame. Keep primary actions visible without obscuring the map, use clear focus states and labels, and respect reduced-motion preferences. Small animations should reinforce meaningful actions such as marking a summit rather than run continuously.

The map, guide, and planner should remain understandable as separate panels connected by the shared catalog. Avoid adding controls that duplicate native map navigation or presenting generated estimates with the authority of verified route facts.

## Roadmap

These are future opportunities, not current capabilities:

- Improve route-specific source coverage and evaluate itinerary quality across short hikes, treks, and long technical expeditions.
- Expand cost analysis only when maintained or retrieved evidence supports identifiable line items, inclusions, and per-person or shared calculations.
- Add editable plans, targeted revisions, and persistent storage only with explicit conflict, privacy, deletion, and retention behavior.
- Consider bounded external research for current fees or access information after validating source quality, provider terms, latency, and cost. Do not allow search output to become trusted instructions or unsupported travel claims.
- Add any live travel-price or booking provider only as a separate, explicitly scoped feature. Home-city transportation planning remains outside the current product direction.
- Revisit authentication, shared rate limits, and spend controls before expanding public AI usage or saving personal plans.

## Verification

Run `npm test`, `npm run lint`, and `npm run build` after meaningful changes. Tests cover key catalog, itinerary, route-time, recommendation, and session behaviors. Browser verification is useful for changed map and modal flows when browser tooling is available.
