import type { MountainCatalogEntry } from "./mountains";

export type RoutePoint = {
  name: string;
  aliases: string[];
  elevationMeters: number;
  sourceUrl: string;
};
export type RouteProfile = {
  route: string;
  points: RoutePoint[];
  sections: { from: string; to: string; difficulty: string }[];
  note: string;
};

const EVEREST_CAMPS_SOURCE = "https://www.alpineascents.com/climbs/mount-everest/itinerary/";
const EVEREST_TERRAIN_SOURCE = "https://altitudejunkies.com/everestroute.html";

// Every mountain gets its catalog route and summit benchmark. Additional named
// points and terrain are included only when maintained source material supports them.
export function getRouteProfile(
  mountain: MountainCatalogEntry,
  objective: string,
): RouteProfile {
  const profile: RouteProfile = {
    route: mountain.difficulty.ascent,
    points: objective === "summit" && mountain.kind === "mountain" ? [{
      name: "Summit", aliases: [mountain.name, `${mountain.name} summit`],
      elevationMeters: mountain.elevationMeters,
      sourceUrl: mountain.difficulty.sourceUrl,
    }] : [],
    sections: [],
    note: "Only listed point elevations are sourced. Unknown camp or trailhead elevations must remain null; do not infer a route profile from summit height.",
  };
  if (mountain.id === "everest" && objective === "summit") {
    profile.points.push(
      { name: "Base Camp", aliases: ["Everest Base Camp", "EBC"], elevationMeters: 5364, sourceUrl: EVEREST_CAMPS_SOURCE },
      { name: "Camp 1", aliases: ["Camp I", "C1"], elevationMeters: 5943, sourceUrl: EVEREST_CAMPS_SOURCE },
      { name: "Camp 2", aliases: ["Camp II", "C2", "Advanced Base Camp"], elevationMeters: 6400, sourceUrl: EVEREST_CAMPS_SOURCE },
      { name: "Camp 3", aliases: ["Camp III", "C3"], elevationMeters: 7162, sourceUrl: EVEREST_CAMPS_SOURCE },
      { name: "Camp 4", aliases: ["Camp IV", "C4", "South Col"], elevationMeters: 8016, sourceUrl: EVEREST_CAMPS_SOURCE },
    );
    profile.sections = [
      { from: "Base Camp", to: "Camp 1", difficulty: "Khumbu Icefall: broken glacier, crevasses and shifting ice; seasonal ladders and fixed lines." },
      { from: "Camp 1", to: "Camp 2", difficulty: "Western Cwm glacier: crevasses and continued altitude exposure." },
      { from: "Camp 2", to: "Camp 3", difficulty: "Lhotse Face: steep snow or ice on fixed lines." },
      { from: "Camp 3", to: "Camp 4", difficulty: "Upper Lhotse Face, Yellow Band and Geneva Spur; steep terrain and exposure." },
      { from: "Camp 4", to: "Summit", difficulty: "Southeast Ridge: exposed high-altitude ascent and a long return to high camp." },
    ];
    profile.note = `Camp elevations are Alpine Ascents planning benchmarks, not fixed campsite locations. Terrain reference: ${EVEREST_TERRAIN_SOURCE}. Confirm the operator’s actual camp locations and route.`;
  }
  return profile;
}
