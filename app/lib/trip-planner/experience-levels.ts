import type { TripInput } from "./schema";

// Shared wording keeps the form and AI context aligned as experience levels evolve.
export const MOUNTAIN_EXPERIENCE: Record<
  TripInput["experience"],
  { label: string; description: string }
> = {
  beginner: {
    label: "Beginner — new to mountain trips",
    description:
      "Little or no mountain experience; looking for an approachable first trip.",
  },
  regular: {
    label: "Regular hiker — day hikes",
    description:
      "Comfortable with day hikes on established trails, with limited multi-day or altitude experience.",
  },
  "multi-day": {
    label: "Experienced trekker — multi-day hikes",
    description:
      "Completed multi-day treks with long days, uneven terrain, and overnight stays on the route.",
  },
  "high-altitude": {
    label: "High-altitude trekker — 3,000–5,000 m",
    description:
      "Trekking experience around 3,000–5,000 m, without assuming technical climbing skills.",
  },
  "high-altitude-summits": {
    label: "Climbed a few non-technical 5,000–8,000 m peaks",
    description:
      "Completed a few high-altitude ascents on non-technical routes. This does not imply glacier, rope, or ice-climbing skills.",
  },
  technical: {
    label: "Technical mountaineer — snow, glaciers & ropes",
    description:
      "Experience using mountaineering equipment and techniques on technical snow, glacier, or rock routes; skills vary by route.",
  },
  expert: {
    label: "Mountaineering expert — technical expeditions",
    description:
      "Extensive technical mountaineering and expedition experience. Route-specific skills and support still need confirmation.",
  },
};
