export type ElevationFilter =
  "all" | "under-2500" | "2500-3999" | "4000-5999" | "6000-7999" | "8000-plus";

// Inclusive lower and exclusive upper bounds keep adjacent bands from overlapping.
const elevationRanges: Record<
  Exclude<ElevationFilter, "all">,
  readonly [number, number]
> = {
  "under-2500": [0, 2500],
  "2500-3999": [2500, 4000],
  "4000-5999": [4000, 6000],
  "6000-7999": [6000, 8000],
  "8000-plus": [8000, Infinity],
};

export function matchesElevation(
  elevationMeters: number,
  filter: ElevationFilter,
) {
  if (filter === "all") return true;

  const [minimum, maximum] = elevationRanges[filter];

  return elevationMeters >= minimum && elevationMeters < maximum;
}
