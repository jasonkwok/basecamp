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
} as const;

export type MountainTagId = keyof typeof MOUNTAIN_TAGS;
