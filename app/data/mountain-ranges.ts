export type MountainRange = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  coordinates: [longitude: number, latitude: number];
  labelOffset: [x: number, y: number];
  bounds: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
};

// Regional labels mark broad mountain systems; coordinates are visual anchors.
export const MOUNTAIN_RANGES: MountainRange[] = [
  {
    id: "himalayas",
    name: "Himalayas",
    emoji: "🏔️",
    description: "High mountain country across Nepal, India, Bhutan and Tibet.",
    coordinates: [85, 28],
    labelOffset: [48, -28],
    bounds: { west: 70, east: 101, south: 25, north: 37 },
  },
  {
    id: "andes",
    name: "Andes",
    emoji: "🌄",
    description: "The long mountain spine running along western South America.",
    coordinates: [-70, -20],
    labelOffset: [0, -32],
    bounds: { west: -82, east: -65, south: -57, north: 13 },
  },
  {
    id: "alps",
    name: "Alps",
    emoji: "🏔️",
    description: "A major European range across Central Europe.",
    coordinates: [10, 46],
    labelOffset: [0, -34],
    bounds: { west: 4, east: 17, south: 43, north: 49 },
  },
  {
    id: "rocky-mountains",
    name: "Rocky Mountains",
    emoji: "🌲",
    description: "A vast North American range across the United States and Canada.",
    coordinates: [-110, 45],
    labelOffset: [0, -34],
    bounds: { west: -127, east: -100, south: 28, north: 63 },
  },
  {
    id: "east-african-highlands",
    name: "East African Highlands",
    emoji: "🌋",
    description: "Highlands and volcanic peaks across Tanzania, Kenya and Uganda.",
    coordinates: [36, -3],
    labelOffset: [0, 34],
    bounds: { west: 27, east: 43, south: -13, north: 13 },
  },
  {
    id: "karakoram",
    name: "Karakoram",
    emoji: "❄️",
    description: "A high glaciated range across Pakistan, China and India.",
    coordinates: [75, 36],
    labelOffset: [-52, -30],
    bounds: { west: 72, east: 82, south: 33, north: 39 },
  },
  {
    id: "southern-alps",
    name: "Southern Alps",
    emoji: "🏔️",
    description: "The principal alpine range along New Zealand’s South Island.",
    coordinates: [170, -43],
    labelOffset: [0, -32],
    bounds: { west: 164, east: 176, south: -48, north: -39 },
  },
];

type Coordinates = readonly [longitude: number, latitude: number];

// Return a range only when every peak in the group lies inside its bounds.
export function findMountainRangeForGroup(coordinates: readonly Coordinates[]) {
  if (coordinates.length === 0) return null;

  const matches = MOUNTAIN_RANGES.filter((range) =>
    coordinates.every(([longitude, latitude]) =>
      longitude >= range.bounds.west &&
      longitude <= range.bounds.east &&
      latitude >= range.bounds.south &&
      latitude <= range.bounds.north,
    ),
  );

  // Prefer the smaller region where broad range boundaries overlap.
  return (
    matches.sort(
      (first, second) =>
        rangeArea(first) - rangeArea(second),
    )[0] ?? null
  );
}

function rangeArea(range: MountainRange) {
  return (
    (range.bounds.east - range.bounds.west) *
    (range.bounds.north - range.bounds.south)
  );
}
