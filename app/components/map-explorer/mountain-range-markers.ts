import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { MOUNTAIN_RANGES, type MountainRange } from "../../data/mountain-ranges";

const RANGE_MARKER_MAX_ZOOM = 4.5;

type RangeMarker = {
  marker: Marker;
  button: HTMLButtonElement;
  description: HTMLSpanElement;
};

// Range markers provide context at the global scale without competing with peaks.
export function attachMountainRangeMarkers(
  instance: MapboxMap,
  mapboxgl: typeof import("mapbox-gl").default,
) {
  const ranges = MOUNTAIN_RANGES.map((range) =>
    createMountainRangeMarker(range, instance, mapboxgl),
  );

  function updateVisibility() {
    const showRanges = instance.getZoom() <= RANGE_MARKER_MAX_ZOOM;

    for (const range of ranges) {
      range.marker.getElement().hidden = !showRanges;

      if (!showRanges) closeRangeDescription(range);
    }
  }

  for (const range of ranges) {
    range.button.addEventListener("click", () => {
      const isOpen = range.button.getAttribute("aria-expanded") === "true";
      ranges.forEach(closeRangeDescription);

      range.button.setAttribute("aria-expanded", String(!isOpen));
      range.description.hidden = isOpen;
    });
  }

  instance.on("zoom", updateVisibility);
  updateVisibility();

  return () => {
    instance.off("zoom", updateVisibility);
    ranges.forEach(({ marker }) => marker.remove());
  };
}

function createMountainRangeMarker(
  range: MountainRange,
  instance: MapboxMap,
  mapboxgl: typeof import("mapbox-gl").default,
): RangeMarker {
  const element = document.createElement("div");
  element.className = "mountain-range-marker";
  element.dataset.rangeId = range.id;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "mountain-range-button";
  button.setAttribute(
    "aria-label",
    `${range.name} mountain range. ${range.description}`,
  );
  button.setAttribute("aria-expanded", "false");
  button.title = `${range.name} · Mountain range`;
  button.textContent = range.emoji;

  const description = document.createElement("span");
  description.className = "mountain-range-description";
  description.id = `mountain-range-description-${range.id}`;
  description.hidden = true;
  button.setAttribute("aria-controls", description.id);

  const name = document.createElement("strong");
  name.textContent = `${range.emoji} ${range.name}`;

  const summary = document.createElement("span");
  summary.textContent = range.description;
  description.append(name, summary);

  element.append(button, description);

  const marker = new mapboxgl.Marker({
    element,
    anchor: "center",
    occludedOpacity: 0,
  })
    .setLngLat(range.coordinates)
    .addTo(instance);

  return { marker, button, description };
}

function closeRangeDescription(range: RangeMarker) {
  range.button.setAttribute("aria-expanded", "false");
  range.description.hidden = true;
}
