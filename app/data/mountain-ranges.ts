export type MountainRange = {
  id: string;
  name: string;
  flags: string[];
  description: string;
  bounds: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
};

// Region bounds provide context for mountain groups on the global map.
export const MOUNTAIN_RANGES: MountainRange[] = [
  {
    id: "himalayas",
    name: "Himalayas",
    flags: ["🇳🇵", "🇮🇳", "🇧🇹", "🇨🇳"],
    description: "High mountain country across Nepal, India, Bhutan and Tibet.",
    bounds: { west: 70, east: 101, south: 25, north: 37 },
  },
  {
    id: "andes",
    name: "Andes",
    flags: ["🇦🇷", "🇧🇴", "🇨🇱", "🇨🇴", "🇪🇨", "🇵🇪", "🇻🇪"],
    description: "The long mountain spine running along western South America.",
    bounds: { west: -82, east: -65, south: -57, north: 13 },
  },
  {
    id: "alps",
    name: "Alps",
    flags: ["🇫🇷", "🇨🇭", "🇮🇹", "🇦🇹", "🇩🇪", "🇸🇮"],
    description: "A major European range across Central Europe.",
    bounds: { west: 4, east: 17, south: 43, north: 49 },
  },
  {
    id: "rocky-mountains",
    name: "Rocky Mountains",
    flags: ["🇺🇸", "🇨🇦"],
    description: "A vast North American range across the United States and Canada.",
    bounds: { west: -127, east: -100, south: 28, north: 63 },
  },
  {
    id: "east-african-highlands",
    name: "East African Highlands",
    flags: ["🇹🇿", "🇰🇪", "🇺🇬"],
    description: "Highlands and volcanic peaks across Tanzania, Kenya and Uganda.",
    bounds: { west: 27, east: 43, south: -13, north: 13 },
  },
  {
    id: "karakoram",
    name: "Karakoram",
    flags: ["🇵🇰", "🇨🇳", "🇮🇳"],
    description: "A high glaciated range across Pakistan, China and India.",
    bounds: { west: 72, east: 82, south: 33, north: 39 },
  },
  {
    id: "southern-alps",
    name: "Southern Alps",
    flags: ["🇳🇿"],
    description: "The principal alpine range along New Zealand’s South Island.",
    bounds: { west: 164, east: 176, south: -48, north: -39 },
  },
];

type Coordinates = readonly [longitude: number, latitude: number];

// Return a range only when every peak in the group lies inside its bounds.
export function findMountainRangeForGroup(coordinates: readonly Coordinates[]) {
  if (coordinates.length === 0) return null;

  const matches = MOUNTAIN_RANGES.map((range) => ({
    range,
    peakCount: coordinates.filter(([longitude, latitude]) =>
      isInsideRange(longitude, latitude, range),
    ).length,
  })).filter(({ peakCount }) => peakCount > 0);

  const completeMatches = matches.filter(
    ({ peakCount }) => peakCount === coordinates.length,
  );

  // Prefer the smaller region where broad range boundaries overlap.
  if (completeMatches.length > 0) {
    return completeMatches.reduce((smallest, match) =>
      rangeArea(match.range) < rangeArea(smallest.range) ? match : smallest,
    ).range;
  }

  // Keep a range label when panning adds an outside peak to its screen cluster.
  const highestPeakCount = Math.max(...matches.map(({ peakCount }) => peakCount));
  const leadingMatches = matches.filter(
    ({ peakCount }) => peakCount === highestPeakCount,
  );

  return leadingMatches.length === 1 ? leadingMatches[0].range : null;
}

function isInsideRange(
  longitude: number,
  latitude: number,
  range: MountainRange,
) {
  return (
    longitude >= range.bounds.west &&
    longitude <= range.bounds.east &&
    latitude >= range.bounds.south &&
    latitude <= range.bounds.north
  );
}

function rangeArea(range: MountainRange) {
  return (
    (range.bounds.east - range.bounds.west) *
    (range.bounds.north - range.bounds.south)
  );
}
