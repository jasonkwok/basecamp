export const MAP_START_CENTER: [number, number] = [-98, 39];
export const MAX_EXPLORER_ZOOM = 5.5;
export const SELECTED_SUMMIT_ZOOM = 5.5;
const SUMMIT_CLOSE_ZOOM_STEP = 2;

// Selecting a peak should move in from the U.S.-centered regional overview.
export function getSummitSelectionZoom(currentZoom: number) {
  return Math.max(currentZoom, SELECTED_SUMMIT_ZOOM);
}

// Pull back two zoom levels when a mountain profile closes, keeping its location.
export function getSummitCloseZoom(currentZoom: number, minimumZoom: number) {
  return Math.max(minimumZoom, currentZoom - SUMMIT_CLOSE_ZOOM_STEP);
}
