# Map explorer: first milestone

Build the initial landing page from `design.md`: a working, responsive world map explorer with no mountain data yet. Complete and verify one increment at a time, updating this checklist as work lands.

Use [map explorer research](map-explorer-research.md) for the proposed storybook-atlas styling, interaction defaults, and supporting sources.

Implementation update: Mapbox is connected through Vercel Connect (`mapbox/basecamp-map`) in all three environments. The first explorer is available locally with a globe-only view, a screen-sized world zoom-out limit, and a regional zoom-in cap of 5. Street, building, business, and settlement detail is hidden. Lint/build and initial desktop/mobile browser checks passed. Final globe and zoom-limit checks are recorded below; visual refinements have been reviewed with the user. See `README.md` for local configuration.

## 1. Confirm the map setup

- [x] Verify current Mapbox GL JS setup against official documentation and the installed Next.js client-component guidance.
- [x] Confirm how to obtain a dedicated public Mapbox token and configure it for local development and Vercel. Evaluate whether Connect adds value for this browser-only milestone.
- [x] Choose an initial world view, projection, and base style that support the adventure-atlas direction.
- [x] Select globe-only presentation per user direction; remove projection switching.
- [x] Document required configuration without committing credentials.

Done when the rendering approach and configuration are clear enough to implement.

## 2. Render the interactive map on `/`

- [x] Replace the placeholder landing page with a full-viewport map and a minimal Basecamp identity.
- [x] Load the map in a client component and clean up the map instance on unmount.
- [ ] Support panning and zooming with pointer, touch, and keyboard controls.
- [x] Keep required map attribution visible.

Done when a real world map loads and can be explored locally.

## 3. Add the explorer controls and states

- [x] Provide labeled zoom controls and a reset-to-world-view action.
- [x] Keep north fixed and disable tilt/rotation; provide a pointer alternative to drag panning.
- [x] Show useful loading, missing-configuration, and map-error states, with retry where recovery is possible.
- [x] Use cream surfaces, forest greens, soft map colors, and readable typography from the proposed visual direction.
- [ ] Keep controls usable on small screens, with visible keyboard focus and reduced-motion support.
- [ ] Aim for 44 × 44 CSS pixel controls; preserve map space, safe areas, and attribution.
- [ ] Review the palette, outlines, typography, and label density at world, continent, and regional zoom levels.
- [x] Keep the interface focused on actions that work in this milestone.

Done when the map feels usable on desktop and mobile, including recoverable failures.

## 4. Verify and review

- [x] Run lint and a production build.
- [ ] Check the real map in a browser: initial load, pan, zoom, reset, resize, and touch/mobile layout.
- [ ] Check keyboard controls, focus visibility, attribution, and reduced motion.
- [ ] Check missing-token and load-failure behavior and inspect browser console errors.
- [x] Review the first milestone with the user before expanding scope.

Done when verification results and any remaining limitations are documented.

## Later milestones

Mountain markers and catalog data, mountain profiles, search and filters, a browsable mountain list, the AI guide, and expedition planning follow this milestone. Production deployment is a separate requested action.

## Verification notes

- Live Vercel Connect → public Mapbox credential → browser rendering verified locally.
- Desktop/mobile rendering, zoom, help, directional pan, keyboard interaction, and reset checked in Chromium; no page errors observed.
- Simulated missing-configuration response and retry recovery verified.
- Zoom-in limit and disabled control verified at level 5; zoom-out stops at the world overview.
- Physical touch gestures remain to be checked on a real device. Visual refinements were reviewed with the user before the requested release.
