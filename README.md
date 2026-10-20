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

The explorer uses a globe view. Zoom stays between a screen-sized world overview and level 5 for regional mountain browsing; roads, buildings, businesses, and settlement labels are hidden. The catalog contains the Seven Summits (Messner/Oceania list, including Carstensz Pyramid), all 14 classic eight-thousanders, and 50 additional curated popular destinations (70 unique entries), with illustrated markers and a summit picker. The shared catalog lives in `app/data/mountains.json`; `app/data/mountains.ts` validates it. Selecting a peak opens a profile with elevation, coordinates, a short description, category badges, ascent-specific difficulty, trip length estimates, and sources. See [the catalog guide](app/data/README.md) to expand it. Route planning is not included yet.

Nearby mountain illustrations group by their screen footprint as you pan and zoom. Choose a counted marker to browse its peaks, then select one to center its actual coordinates and show its name and badges. The picker supports text search and combined tag, difficulty, elevation, and region filters; each result shows its tags and difficulty. Popular picks are a geographically varied editorial selection, not an authoritative popularity ranking.
