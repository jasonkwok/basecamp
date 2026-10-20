// Add new badge definitions here, then assign their IDs to catalog entries.
export const MOUNTAIN_TAGS = {
  popular: {
    label: "Popular",
    icon: "♥",
    description: "Curated popular destination · not a popularity ranking",
  },
  "seven-summits": {
    label: "7 Summits",
    icon: "★",
    description: "Seven Summits · highest peak on each continent (Oceania list)",
  },
  "eight-thousander": {
    label: "8,000m+",
    icon: "❄",
    description: "Eight-thousander · summit above 8,000 metres",
  },
  volcano: { label: "Volcano", icon: "🌋", description: "Volcanic mountain or volcanic island summit" },
  trekking: { label: "Trekking route", icon: "🥾", description: "A named hiking or trekking route is described" },
  "technical-climb": { label: "Technical climb", icon: "🧗", description: "The described ascent includes technical rock, snow or glacier climbing" },
  "cultural-site": { label: "Cultural site", icon: "🏛️", description: "A landmark or mountain with particular cultural significance" },
} as const;

export type MountainTagId = keyof typeof MOUNTAIN_TAGS;
