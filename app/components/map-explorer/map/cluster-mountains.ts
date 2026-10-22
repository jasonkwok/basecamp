import type { MountainCatalogEntry } from "../../../data/mountains";

export type ProjectedSummit = { summit: MountainCatalogEntry; x: number; y: number };

// Group overlapping screen footprints without changing geographic coordinates.
// Connected groups stay browsable even when summit locations are almost identical.
export function clusterMountains(points: ProjectedSummit[]): MountainCatalogEntry[][] {
  const parents = points.map((_, index) => index);

  // Follow parent links to find the shared group for a projected marker.
  function root(index: number): number {
    while (parents[index] !== index) index = parents[index];

    return index;
  }

  // Merge overlapping pairs; chains of overlaps belong to the same group.
  for (let a = 0; a < points.length; a++) {
    for (let b = a + 1; b < points.length; b++) {
      if (
        Math.abs(points[a].x - points[b].x) < 190 &&
        Math.abs(points[a].y - points[b].y) < 185
      ) {
        parents[root(b)] = root(a);
      }
    }
  }

  // Collect actual catalog records without altering their geographic positions.
  const groups = new Map<number, MountainCatalogEntry[]>();

  points.forEach((point, index) => {
    const key = root(index);
    const group = groups.get(key) ?? [];
    group.push(point.summit);

    groups.set(key, group);
  });

  return [...groups.values()];
}
