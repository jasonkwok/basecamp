# Mountain catalog

`mountains.json` is the source of truth for the map catalog. It contains 100 mountain and trekking-destination records with stable IDs, geographic locations, elevations in metres, concise descriptions, category tags, route-specific difficulty context, review dates, and factual source links.

To add a mountain, copy an existing record into the `mountains` array and update each field:

- Use a unique, stable `id` and a readable `name`.
- Store `coordinates` as explicitly named `longitude` and `latitude` values in decimal degrees.
- Use metres above sea level for `elevationMeters` and describe the mountain in `description`. Keep route advice separate.
- Assign existing category IDs in `tags`. Define additional categories in `mountain-tags.ts` first. Popular is an editorial selection, not a statistical ranking. Seven Summits uses the Messner/Oceania version.
- Set `difficulty.level` to `beginner`, `intermediate`, `difficult`, `expert`, or `extreme`. Include the specific ascent context, the reason for the rating, and its reference in the other difficulty fields. These are Basecamp editorial experience bands, not official climbing grades or current-condition reports.
- Add HTTPS references in `sources`, and update `reviewedAt` when checking the facts. Summit elevations can vary with surveys and snow cover.

`mountains.ts` validates the JSON and converts the coordinates to Mapbox's longitude-first tuple. The map, grouped markers, picker, badges, profile cards, and trip planner all consume the same catalog. Add trek itineraries as `destination` records with the `trekking` tag; the catalog has no fixed record-count limit.

`mountain-ranges.ts` defines names, flags, descriptions, and approximate bounds for grouping peaks by range. It supplies context in grouped mountain views and is not a trip-planning catalog.

Run `npm run lint` and `npm run build` after editing. Check the new marker, its profile, and any nearby group in the local app.

Each record includes `kind` (`mountain` or `destination`) and `tripLength` with integer `minDays` / `maxDays`, `basis: "editorial"`, `context` and an HTTPS `sourceUrl` for route context. Trip ranges are Basecamp editorial planning estimates, not sourced operator promises or acclimatization recommendations. Describe included approach/acclimatization and excluded travel explicitly; short itineraries assume prior acclimatization where needed. The UI displays days, or approximate 30-day months for longer expeditions. Machu Picchu represents the citadel at 2,430 m and uses an Inca Trail itinerary, not the separate Machu Picchu Mountain summit.

Difficulty and elevation info buttons open accessible field-guide dialogs. Altitude display bands are approximate conventions, with CDC altitude-risk guidance and research on 8,000 m ascents linked in the dialog. Oxygen use above 8,000 m is common, not a universal requirement.

Available tags include Popular, 7 Summits, 8,000m+, Volcano, Trekking route, Technical climb and Cultural site. Tags describe editorial collections, geology, route style or visitor context. The picker combines free-text search with tag, difficulty, altitude band and continent filters; each result displays every assigned tag and its difficulty band.
