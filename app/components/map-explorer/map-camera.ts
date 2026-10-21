export const MAP_START_CENTER: [number, number] = [-98, 39];
export const MAX_EXPLORER_ZOOM = 5.5;
export const SELECTED_SUMMIT_ZOOM = 5.5;

// Selecting a peak should move in from the U.S.-centered regional overview.
export function getSummitSelectionZoom(currentZoom: number) {
  return Math.max(currentZoom, SELECTED_SUMMIT_ZOOM);
}
