import type { RouteProfile } from "../../data/route-profiles";
import type { StageRouteDetails } from "./schema";

type AltitudeChange = StageRouteDetails["altitudeChanges"][number];
const normalize = (label: string) => label.trim().toLowerCase().replace(/\s+/g, " ");

// Model-supplied numbers are not route references. Resolve each named endpoint
// against this mountain's maintained profile, clearing anything not supported.
export function applyRouteElevationReferences(
  stages: { routeDetails: StageRouteDetails }[],
  profile: RouteProfile,
) {
  const points = new Map(profile.points.flatMap((point) =>
    [point.name, ...point.aliases].map((name) => [normalize(name), point.elevationMeters] as const),
  ));
  for (const stage of stages) {
    for (const change of stage.routeDetails.altitudeChanges) {
      change.fromMeters = points.get(normalize(change.from)) ?? null;
      change.toMeters = points.get(normalize(change.to)) ?? null;
    }
  }
}

function endpoint(name: string, meters: number | null) {
  return meters === null ? name :
    `${name} (${meters.toLocaleString("en-US")} m / ${Math.round(meters * 3.28084).toLocaleString("en-US")} ft)`;
}

export function getElevationDataNote(stages: { routeDetails: StageRouteDetails }[]) {
  const movements = stages.flatMap(({ routeDetails }) => routeDetails.altitudeChanges);
  const hasGap = stages.some(({ routeDetails }) => routeDetails.altitudeChanges.length === 0) ||
    movements.some(({ fromMeters, toMeters }) => fromMeters === null || toMeters === null);
  if (stages.length === 0 || !hasGap) return null;
  const hasElevation = movements.some(({ fromMeters, toMeters }) => fromMeters !== null || toMeters !== null);
  return hasElevation
    ? "Full route elevation data is unavailable. Known elevations are shown; changes appear only where both endpoints are known."
    : "Elevation data is unavailable for this route.";
}

export function formatAltitudeChange(change: AltitudeChange) {
  const route = `${endpoint(change.from, change.fromMeters)} → ${endpoint(change.to, change.toMeters)}`;
  if (change.fromMeters === null || change.toMeters === null) {
    return { route, change: null };
  }
  const delta = change.toMeters - change.fromMeters;
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return {
    route,
    change: `${sign}${Math.abs(delta).toLocaleString("en-US")} m / ${sign}${Math.round(Math.abs(delta) * 3.28084).toLocaleString("en-US")} ft${delta === 0 ? " net" : ""}`,
  };
}
