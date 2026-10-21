export type MountainRange = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  coordinates: [longitude: number, latitude: number];
};

// Regional labels mark broad mountain systems; coordinates are visual anchors.
export const MOUNTAIN_RANGES: MountainRange[] = [
  {
    id: "himalayas",
    name: "Himalayas",
    emoji: "🏔️",
    description: "High mountain country across Nepal, India, Bhutan and Tibet.",
    coordinates: [85, 28],
  },
  {
    id: "andes",
    name: "Andes",
    emoji: "🌄",
    description: "The long mountain spine running along western South America.",
    coordinates: [-70, -20],
  },
  {
    id: "alps",
    name: "Alps",
    emoji: "🏔️",
    description: "A major European range across Central Europe.",
    coordinates: [10, 46],
  },
  {
    id: "rocky-mountains",
    name: "Rocky Mountains",
    emoji: "🌲",
    description: "A vast North American range across the United States and Canada.",
    coordinates: [-110, 45],
  },
  {
    id: "east-african-highlands",
    name: "East African Highlands",
    emoji: "🌋",
    description: "Highlands and volcanic peaks across Tanzania, Kenya and Uganda.",
    coordinates: [36, -3],
  },
  {
    id: "karakoram",
    name: "Karakoram",
    emoji: "❄️",
    description: "A high glaciated range across Pakistan, China and India.",
    coordinates: [75, 36],
  },
  {
    id: "southern-alps",
    name: "Southern Alps",
    emoji: "🏔️",
    description: "The principal alpine range along New Zealand’s South Island.",
    coordinates: [170, -43],
  },
];
