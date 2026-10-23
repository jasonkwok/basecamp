# Basecamp 🏔️

**Your next adventure starts here.**

Just as base camp is the starting point for a mountain climb, Basecamp is where you begin planning your next adventure.

[Explore Basecamp](https://basecamp-discover.vercel.app) · [GitHub repository](https://github.com/jasonkwok/basecamp)

## Why I built it

I love adventures that challenge me. Completing something difficult gives me a sense of accomplishment and pride, and I wanted to help others discover adventures that give them that same feeling. I hiked Machu Picchu in 2024 and was hooked ever since. I went on to summit Kilimanjaro in 2025, and hopefully there are many more adventures to come :).

Along the way, I couldn't find a one-stop shop for discovering mountaineering trips and longer treks. Strava helped me look back on my activities, and AllTrails helped me find individual trails, while tour operator websites tended to focus on selling specific trips. Choosing a bigger adventure that matched my experience and goals still took a lot of research. I wanted to make that discovery feel as exciting as the adventure itself.

I built Basecamp to make it easier to discover mountains that match your interests and experience, learn what each climb involves, and put together an initial trip plan.

## What I Built

Basecamp is a web app for discovering mountains and drafting adventure itineraries. Its interactive globe shows 100 mountain and trekking destinations, each with curated tags and badges. Profiles include elevation, route-specific difficulty, estimated trip length, and a per-person cost range. Travelers can mark mountains they have summited, and named mountain ranges group nearby peaks on the map.

An optional AI guide uses the same catalog to suggest destinations based on a traveler’s experience and preferences. Recommendations link to destination profiles and can be downloaded as Markdown.

After selecting a destination, travelers can request an itinerary for a summit attempt, trek, or visit. The planner uses their experience, party size, and timing preferences to create a draft with daily stages or expedition phases and equipment guidance. Plans are initial references that can be downloaded as Markdown.

Basecamp uses Next.js for the application and server endpoints, React for the interactive interface, and Mapbox for the globe and mountain markers. Vercel AI SDK handles structured AI responses, while Vercel AI Gateway connects the app to GPT-4.1 mini for mountain recommendations and itinerary generation.

## Key decisions

- **Personalization without a login flow.** I considered adding accounts so users could save their progress and receive personalized recommendations, but authentication and persistent user data would expand the scope too much. I chose browser session storage for summited mountains instead. The guide can use that history to suggest a next adventure without requiring sign-up. The tradeoff is that progress stays within the current tab’s session rather than following the user across sessions or devices.
- **Let users keep the AI’s work through Markdown.** I wanted users to keep the recommendations and plans they generated. Hosting shareable links or saving that work to an account would add storage, sharing, and login flows beyond the scope of this build. I chose Markdown downloads so users can reread the output later or bring it into another AI tool to continue planning. The tradeoff is that Basecamp does not save or resume that work in the app.
- **Lead with a globe.** I considered starting with a globe, a list of mountains, or an AI agent. I chose the globe to make the first experience playful and inviting for beginners. It gives people a way to discover destinations visually before they know a mountain name or what to ask. Search and the AI guide remain available when users want a more directed way to explore.
- **Keep itinerary inputs focused.** I chose the fields most relevant to a useful itinerary: destination, objective, experience, party size, and timing. These inputs give the AI a defined planning task and help keep the result relevant. I considered a freeform notes box, but open-ended requests would introduce more ambiguity and make generation harder to validate. Keeping the inputs structured was also intended to keep generation time more predictable. The tradeoff is less flexibility for travelers with unusual requirements.
- **Include a broad range of challenges.** I wanted Basecamp to serve experienced climbers as well as beginners, so the catalog includes easy treks alongside technical climbs and major expeditions. Difficulty and experience context help users find a suitable objective within that range. The tradeoff is broader route coverage to maintain, with different preparation needs for each level.

## Where I used AI and what I drove

I built out the user flows, struct definitions, and component definitions, and drove the product direction throughout the project. I used Codex Sol 6.1 as a development collaborator, working from [design.md](design.md); it helped with much of the heavier UI design work and testing.

Within Basecamp, AI SDK and Vercel AI Gateway power mountain recommendations and itinerary drafts using `openai/gpt-4.1-mini` by default. The application supplies catalog context and equipment references, validates generated output, and applies experience policies.
