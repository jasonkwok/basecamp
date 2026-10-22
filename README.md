# Basecamp 🏔️

**Your next adventure starts here.**

Just as base camp is the starting point for a mountain climb, Basecamp is where you begin planning your next adventure.

[Explore Basecamp](https://basecamp-discover.vercel.app) · [GitHub repository](https://github.com/jasonkwok/basecamp)

## Why I built it

I love adventures that challenge me. Completing something difficult gives me a sense of accomplishment and pride, and I wanted to help others discover adventures that give them that same feeling. I hiked Machu Picchu in 2024 and was hooked ever since. I went on to summit Kilimanjaro in 2025, and hopefully there are many more adventures to come :).

One thing I realized along the way is that finding the right adventure isn't always easy. There are incredible mountains everywhere, but figuring out which ones match your interests and experience takes a lot of research. You can ask ChatGPT/Claude for recommendations, but the experience isn't particularly visual or tailored to your hiking background and goals. On the other hand, tour operators typically have websites that can be difficult to navigate and are often focused on selling specific trips, rather than helping you explore your options. I wanted something that made discovering your next adventure feel just as exciting as planning it.

I built Basecamp to make it easier to discover mountains that match your interests and experience, learn what each climb involves, and put together an initial trip plan.

## What I Built

Basecamp is a web app for discovering mountains and drafting adventure itineraries. Its interactive globe shows 100 mountain and trekking destinations, each with curated tags and badges. Profiles include elevation, route-specific difficulty, estimated trip length, and a per-person cost range. Travelers can mark mountains they have summited, and named mountain ranges group nearby peaks on the map.

An optional AI guide uses the same catalog to suggest destinations based on a traveler’s experience and preferences. Recommendations link to destination profiles and can be downloaded as Markdown.

After selecting a destination, travelers can request an itinerary for a summit attempt, trek, or visit. The planner uses their experience, party size, and timing preferences to create a draft with daily stages or expedition phases and equipment guidance. Plans are initial references that can be downloaded as Markdown.

Basecamp uses Next.js for the application and server endpoints, React for the interactive interface, and Mapbox for the globe and mountain markers. Vercel AI SDK handles structured AI responses, while Vercel AI Gateway connects the app to GPT-4.1 mini for mountain recommendations and itinerary generation.

## Key decisions

- **Personalize without accounts.** Summit progress stays in the browser session and informs recommendations. This avoids sign-up, but progress does not follow users across sessions or devices.
- **Export AI results as Markdown.** Downloads let travelers keep and reuse recommendations and itineraries without account storage or share links. Basecamp cannot save or resume plans.
- **Start with a globe.** Visual exploration makes discovery approachable; search and the AI guide support more directed browsing.
- **Use focused itinerary inputs.** Objective, experience, party size, and timing keep plans relevant and easier to validate. Structured fields offer less flexibility than freeform requests.
- **Cover a wide range of challenges.** The catalog serves beginners through experienced climbers, from treks to major expeditions. That breadth increases the route information Basecamp must maintain.

## Where I used AI and what I drove

I built out the user flows, struct definitions, and component definitions, and drove the product direction throughout the project. I used Codex Sol 6.1 as a development collaborator, working from [design.md](design.md); it helped with much of the heavier UI design work and testing.

Within Basecamp, AI SDK and Vercel AI Gateway power mountain recommendations and itinerary drafts using `openai/gpt-4.1-mini` by default. The application supplies catalog context and equipment references, validates generated output, and applies experience policies.
