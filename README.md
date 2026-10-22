This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses `next/font` to self-host Nunito for the interface and rounded map labels.

## Learn More

See [skills.md](skills.md) for recommended development skills and when to use them throughout the project. Agent workflow instructions live in [AGENTS.md](AGENTS.md), and product direction lives in [design.md](design.md).

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Production: [basecamp-pearl-rho.vercel.app](https://basecamp-pearl-rho.vercel.app)

The GitHub repository `jasonkwok/basecamp` is connected to the Vercel project `basecamp` in the `jason-personal1` team. The framework preset must be **Next.js**.

### Deploy through GitHub

Vercel automatically deploys pushes to `main` to production. After committing your changes on `main`, run:

```bash
git push origin main
```

Check the deployment status in the [Vercel dashboard](https://vercel.com/jason-personal1/basecamp).

### Deploy manually with the Vercel CLI

From the repository root, with the Vercel CLI installed and authenticated (`vercel login`), verify that your checkout is clean and matches GitHub's `main`:

```bash
git switch main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
gh api repos/jasonkwok/basecamp/commits/main --jq .sha
```

The status output should be empty and both commit hashes should match. A CLI deployment uploads the local files, so uncommitted changes would also be deployed.

Verify the linked project before deploying:

```bash
vercel project inspect --non-interactive
```

It should report `jason-personal1/basecamp` with the Next.js framework preset. For a new checkout, link it first with `vercel link --project basecamp --scope jason-personal1`, then inspect it again.

Deploy to production and check the public URL:

```bash
vercel deploy --prod --yes --scope jason-personal1
curl -I https://basecamp-pearl-rho.vercel.app
```

Confirm the deployment reports `READY` and the production URL returns HTTP 200.

## Map explorer configuration

The landing page uses Mapbox GL JS. Vercel Connect stores the dedicated public Mapbox token in the `mapbox/basecamp-map` API-key connector, attached to Basecamp in Development, Preview, and Production.

`MAPBOX_CONNECTOR=mapbox/basecamp-map` is configured in Vercel. For local development, refresh the environment and development OIDC token before starting:

```bash
vercel env pull .env.local --yes --scope jason-personal1
npm run dev
```

The server-only `/api/map-config` handler requests the credential through `@vercel/connect` using Vercel OIDC. It deliberately returns only a public `pk.` Mapbox token for browser rendering and rejects secret tokens. No Mapbox token is committed or embedded at build time. Configure the public token's allowed URLs in Mapbox for localhost and the intended deployment domains. If local Connect authentication expires, pull the environment again and restart the server.

The explorer uses a globe view. Zoom stays between a screen-sized world overview and level 5 for regional mountain browsing; roads, buildings, businesses, and settlement labels are hidden. The catalog contains the Seven Summits (Messner/Oceania list, including Carstensz Pyramid), all 14 classic eight-thousanders, and 50 additional curated popular destinations (70 unique entries), with illustrated markers and a summit picker. The shared catalog lives in `app/data/mountains.json`; `app/data/mountains.ts` validates it. Selecting a peak opens a profile with elevation, coordinates, a short description, category badges, ascent-specific difficulty, trip length estimates, and sources. See [the catalog guide](app/data/README.md) to expand it. A basic AI-assisted itinerary preview is available from the selected mountain’s planning button; see below.

Nearby mountain illustrations group by their screen footprint as you pan and zoom. Choose a counted marker to browse its peaks, then select one to center its actual coordinates and show its name and badges. The picker supports text search and combined tag, difficulty, elevation, and region filters; each result shows its tags and difficulty. Popular picks are a geographically varied editorial selection, not an authoritative popularity ranking.

## AI-assisted itinerary MVP

Select an individual mountain, then choose **Plan your [mountain] adventure!** Enter your departure city/country, party size, objective, and experience. Timing can be recommended by the planner, an approximate month, a season expressed as months, a flexible travel window, or exact dates. Budget and currency questions are no longer shown. Every mountain’s Field Notes shows a per-person USD range for its named ascent or visit. Published-price anchors inform selected routes; other ranges are broad comparable-trip allowances, not independently verified route quotes. International flights, personal equipment, insurance, tips, and emergencies are excluded. The form shows the mountain’s ascent-duration estimate from Field Notes. Days available are optional for flexible timing; the planner can suggest a length. Trips support up to 120 days, including travel from home and back. Short trips use daily details (up to 21 entries); longer trips and multi-week climbs use expedition phases with provisional day/week ranges, rest and weather buffers, and conditions for progression. An inadequate time window still requires changes rather than silently shortening an ascent.

The server uses Vercel AI SDK structured output through AI Gateway, authenticated with Vercel OIDC. No direct model-provider key is needed on Vercel. For local development, refresh authentication before starting as described above:

```bash
vercel env pull .env.local --yes --scope jason-personal1
npm run dev
```

The default model is `openai/gpt-4.1-mini`, verified with the current Gateway account. Free-credit access covers a subset of models; a valid catalog ID alone does not establish account access. Optionally set the server-only `AI_GATEWAY_MODEL` to another Gateway model ID supporting structured output. Alternatively, store `AI_GATEWAY_API_KEY` in an ignored `.env.development.local` file locally and the Vercel project’s environment settings for deployment. Keeping a local key separate prevents `vercel env pull` from overwriting it. The key takes precedence over OIDC. Never expose either credential through `NEXT_PUBLIC_` variables. The SDK requires Node.js 22 or later.

The result contains a basic itinerary, timing guidance, budget considerations, a packing starter list, and assumptions. Flexible plans show numbered days without invented calendar dates; exact-date plans retain their dates. Seasonal advice is provisional and is not a live forecast or access check. It does not fetch live prices, make bookings, verify trail conditions, or save drafts after closing. An infeasible or unsupported objective may return questions or suggested changes instead of an itinerary.

Generation is bounded to one model call, 5,000 output tokens, and 50 seconds. A best-effort per-instance limit allows 50 requests per IP per feature per hour; use shared application rate limits and Gateway spend controls before public rollout. Authentication errors require refreshed local environment credentials; credit/account errors require checking AI Gateway setup. Inputs and the last valid result remain available after a recoverable error.

Run validation checks with `npm test`, `npm run lint`, and `npm run build`.

### Test the planner without AI tokens

Run `npm run dev:mock` (or `npm run dev:mock -- --port 3001` if another server is running). Open that local server and use the normal form. Mock responses are clearly labeled, skip AI calls and the draft quota, and exercise real request/response validation. This mode only runs under `next dev`; production ignores it.

- **Beginner + Everest + Summit:** the real safety policy strongly advises against climbing, returns no ascent days, and keeps the equipment reference visible. This case already uses no AI tokens even outside mock mode.
- **Successful draft:** choose a visit or trek to display placeholder days and equipment references. Exact dates and flexible durations are supported.
- **Generation failure:** run `TRIP_PLANNER_MOCK=error npm run dev` to test the error message and retained form details.
- **Invalid model output:** run `TRIP_PLANNER_MOCK=invalid npm run dev` to test schema-validation failure recovery.

Safety checks run before mock scenarios. Use a suitable visit/trek request to exercise failures. Restart the server when changing scenarios. Mock mode tests application behavior, not model or prompt quality.

To preview expedition phases without AI tokens, run mock mode, select Everest, Summit ascent, Mountaineering expert, and 60 days available. A beginner selecting the same summit still receives the real warning and no ascent schedule. Phase durations are test allocations, not a vetted climbing itinerary.

Itinerary days and phases include a hiking/climbing-time section. Reviewed route references supply numeric segment ranges, scope (one-way ascent/descent), and source links. The initial numeric reference covers Everest’s South Col route; other routes explicitly ask for guide-confirmed timings until references are added. Never treat movement estimates as guaranteed pace or a turnaround schedule.
