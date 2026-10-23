export const MAP_START_CENTER: [number, number] = [-98, 39];
export const MAX_EXPLORER_ZOOM = 5.5;
export const SELECTED_SUMMIT_ZOOM = 5.5;
const SUMMIT_CLOSE_ZOOM_STEP = 2;
const GROUP_ZOOM_STEP = 0.75;

export function getGroupCloseZoom(currentZoom: number, minimumZoom: number) {
  return Math.max(minimumZoom, currentZoom - GROUP_ZOOM_STEP);
}

// Groups are local clusters; unwrap longitudes so dateline ranges stay centered.
export function getGroupCamera(
  coordinates: readonly (readonly [number, number])[],
  currentZoom: number,
) {
  if (coordinates.length === 0) return null;

  const referenceLongitude = coordinates[0][0];
  const longitudes = coordinates.map(([longitude]) =>
    referenceLongitude +
    ((((longitude - referenceLongitude + 180) % 360) + 360) % 360) - 180,
  );
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

  return {
    center: [
      ((longitude + 540) % 360) - 180,
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    ] as [number, number],
    zoom: Math.min(MAX_EXPLORER_ZOOM, currentZoom + GROUP_ZOOM_STEP),
  };
}

// Selecting a peak should move in from the U.S.-centered regional overview.
export function getSummitSelectionZoom(currentZoom: number) {
  return Math.max(currentZoom, SELECTED_SUMMIT_ZOOM);
}

// Pull back two zoom levels when a mountain profile closes, keeping its location.
export function getSummitCloseZoom(currentZoom: number, minimumZoom: number) {
  return Math.max(minimumZoom, currentZoom - SUMMIT_CLOSE_ZOOM_STEP);
}
