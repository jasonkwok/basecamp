# Map explorer: first milestone

Build the initial landing page from `design.md`: a working, responsive world map explorer with no mountain data yet. Complete and verify one increment at a time, updating this checklist as work lands.

Use [map explorer research](map-explorer-research.md) for the proposed storybook-atlas styling, interaction defaults, and supporting sources.

## 1. Confirm the map setup

- [ ] Verify current Mapbox GL JS setup against official documentation and the installed Next.js client-component guidance.
- [ ] Confirm how to obtain a dedicated public Mapbox token and configure it for local development and Vercel. Evaluate whether Connect adds value for this browser-only milestone.
- [ ] Choose an initial world view, projection, and base style that support the adventure-atlas direction.
- [ ] Compare a simplified flat atlas and globe on desktop/mobile; check style/projection compatibility before selecting one.
- [ ] Document required configuration without committing credentials.

Done when the rendering approach and configuration are clear enough to implement.

## 2. Render the interactive map on `/`

- [ ] Replace the placeholder landing page with a full-viewport map and a minimal Basecamp identity.
- [ ] Load the map in a client component and clean up the map instance on unmount.
- [ ] Support panning and zooming with pointer, touch, and keyboard controls.
- [ ] Keep required map attribution visible.

Done when a real world map loads and can be explored locally.

## 3. Add the explorer controls and states

- [ ] Provide labeled zoom controls and a reset-to-world-view action.
- [ ] Keep north fixed and disable tilt/rotation; provide a pointer alternative to drag panning.
- [ ] Show useful loading, missing-configuration, and map-error states, with retry where recovery is possible.
- [ ] Use cream surfaces, forest greens, soft map colors, and readable typography from the proposed visual direction.
- [ ] Keep controls usable on small screens, with visible keyboard focus and reduced-motion support.
- [ ] Aim for 44 × 44 CSS pixel controls; preserve map space, safe areas, and attribution.
- [ ] Review the palette, outlines, typography, and label density at world, continent, and regional zoom levels.
- [ ] Keep the interface focused on actions that work in this milestone.

Done when the map feels usable on desktop and mobile, including recoverable failures.

## 4. Verify and review

- [ ] Run lint and a production build.
- [ ] Check the real map in a browser: initial load, pan, zoom, reset, resize, and touch/mobile layout.
- [ ] Check keyboard controls, focus visibility, attribution, and reduced motion.
- [ ] Check missing-token and load-failure behavior and inspect browser console errors.
- [ ] Review the first milestone with the user before expanding scope.

Done when verification results and any remaining limitations are documented.

## Later milestones

Mountain markers and catalog data, mountain profiles, search and filters, a browsable mountain list, the AI guide, and expedition planning follow this milestone. Production deployment is a separate requested action.
