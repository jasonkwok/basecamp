# Map explorer design research

Research date: October 20, 2026. These are proposed implementation defaults to test, not a finalized visual system.

## Recommended direction: a storybook adventure atlas

Make exploration immediately understandable and give the geography a playful illustrated treatment. The map itself should carry the visual identity, supported by a small amount of friendly interface chrome.

- Pale blue water, warm cream land, sage vegetation, dark forest text, and restrained orange accents.
- Simplified geographic detail and a clear label hierarchy: countries and major places first, local details as users zoom.
- Rounded controls with a subtle dark outline and soft offset shadow; simple, consistent icon shapes.
- Friendly headings with highly readable labels and body text. Avoid decorative handwriting for geographic labels and controls.
- Small illustrations can frame the interface later. Keep the interactive geography unobstructed and geographically accurate.

Mapbox's [coloring-book experiment](https://www.mapbox.com/blog/map-coloring-book-for-everyone) is a useful visual reference for expressive cartography. Borrow its willingness to simplify and stylize, rather than its coloring interaction. A pastel palette alone will not establish the intended cartoonish character: outlines, shapes, typography, and consistent illustration treatment matter too.

## Map style and projection

| Approach | Value for Basecamp | Tradeoff / decision |
| --- | --- | --- |
| Flat atlas with Natural Earth or Equal Earth projection | Curved world silhouette, broad geographic overview, familiar atlas character | Recommended first visual experiment. Verify compatibility with the chosen style; adaptive projections have documented 3D/background limitations. |
| Globe | Tactile exploration and a playful object-like presentation | Strong alternative to compare, especially on mobile. Only half the Earth is visible at once, so destinations can be hidden around the back. |
| Mapbox Standard with configuration | Supported starting point with configurable natural-feature colors, fonts, visibility, and themes | Try a simplified treatment with 3D objects hidden. Confirm whether its available configuration achieves enough visual character before committing to it. |
| Custom Mapbox Studio style | More control over linework, geographic detail, and label hierarchy | Use if the first style experiment cannot achieve the atlas direction. Adds style authoring and maintenance work. |

Mapbox [documents the projection choices and limitations](https://docs.mapbox.com/mapbox-gl-js/guides/projections/) and recommends Standard for new projects in its [style guide](https://docs.mapbox.com/map-styles/guides/standard-styles/). Our flat-atlas preference is a product design hypothesis; test it against the actual style and mobile viewport before finalizing. Do not assume every style/projection combination supports the same effects.

## Easy-to-use interaction defaults

- Open directly into an explorable map. Show a compact Basecamp title and one short hint, such as “Drag to explore. Zoom in for a closer look.” No onboarding gate.
- Keep north up and the view untilted. Disable rotation and pitch gestures, including keyboard equivalents, so users do not accidentally lose orientation.
- Support familiar drag-to-pan, pinch/scroll-to-zoom, and keyboard exploration. Include visible zoom buttons and a labeled “World view” reset.
- Provide a discoverable alternative to dragging for panning, such as a small directional control available through map help. Keyboard support alone does not serve pointer users who cannot drag.
- Use generous controls: target at least 44 × 44 CSS pixels as our project design goal. WCAG's AA minimum is 24 × 24 with exceptions; 44 is our usability choice, not a claim about the AA requirement.
- Keep controls in stable positions, clear of attribution and mobile safe areas. Keep the initial identity panel compact enough to leave most of the map available.
- Use brief, restrained transitions and respect reduced motion. Avoid automatic spinning, bouncing decorations, and repeated camera flights.
- Distinguish loading from failure. Give users a useful explanation and retry action when recovery is possible.
- For this milestone, show only working explorer actions. Add search, mountain lists, and guide entry points when their features exist.

Mapbox's [gesture documentation](https://docs.mapbox.com/mapbox-gl-js/guides/user-interactions/gestures/) explains configurable interactions. W3C explains [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [alternatives to dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html). These sources inform the recommendations; the precise layout and defaults above are Basecamp design decisions to validate.

## Incremental visual review

1. Render a real map and compare a simplified atlas view with a globe on desktop and mobile. Check style compatibility before polishing.
2. Apply one coherent palette, label hierarchy, and control treatment. Review at world, continent, and regional zoom levels.
3. Check whether a new user can pan, zoom, and return to the world view without explanation. Check accidental rotation, touch target sizes, and map area on narrow screens.
4. Verify keyboard, pointer alternatives to dragging, focus, contrast, reduced motion, loading, and failures. Pastel surfaces still need readable text and controls.

Success for this stage: the landing page feels inviting and recognizably Basecamp, and users can explore and recover their bearings immediately. Mountain markers and decorative map content remain outside the current milestone.
