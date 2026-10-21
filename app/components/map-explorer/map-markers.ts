import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { RefObject } from "react";
import { MOUNTAINS, type Summit } from "../../data/mountains";
import { clusterMountains } from "./cluster-mountains";
import { attachMountainRangeMarkers } from "./mountain-range-markers";
import {
  createMountainMarker,
  updateMountainMarker,
  type MountainMarkerElements,
} from "./mountain-marker";

type MarkerOptions = {
  instance: MapboxMap;
  mapboxgl: typeof import("mapbox-gl").default;
  selectedSummitId: RefObject<string | null>;
  markerIndex: Map<string, Marker>;
  onOpenGroup: (summits: Summit[]) => void;
  onOpenSummit: (summit: Summit) => void;
};

// Own the map's markers and camera listeners independently of React rendering.
export function attachMountainMarkers({
  instance,
  mapboxgl,
  selectedSummitId,
  markerIndex,
  onOpenGroup,
  onOpenSummit,
}: MarkerOptions) {
  const markers: Marker[] = [];
  const records = new Map<string, MountainMarkerElements>();
  const removeRangeMarkers = attachMountainRangeMarkers(instance, mapboxgl);

  function updateClusters() {
    if (records.size === 0) return;

    const center = instance.getCenter();
    const radians = Math.PI / 180;
    const centerLat = center.lat * radians;
    const { clientWidth: width, clientHeight: height } =
      instance.getContainer();
    const points = MOUNTAINS.flatMap((summit) => {
      const latitude = summit.coordinates[1] * radians;
      const longitudeDelta = (summit.coordinates[0] - center.lng) * radians;

      // A positive dot product means the mountain faces the camera.
      const facing =
        Math.sin(latitude) * Math.sin(centerLat) +
        Math.cos(latitude) * Math.cos(centerLat) * Math.cos(longitudeDelta);
      const point = instance!.project(summit.coordinates);

      // Exclude the far side of the globe and markers beyond the viewport margin.
      if (
        facing <= 0 ||
        point.x < -200 ||
        point.x > width + 200 ||
        point.y < -200 ||
        point.y > height + 200
      )
        return [];

      return [{ summit, x: point.x, y: point.y }];
    });
    const visibleIds = new Set<string>();

    // Each overlapping group displays one marker while retaining all its peaks.
    for (const group of clusterMountains(points)) {
      const selected = group.find(
        (summit) => summit.id === selectedSummitId.current,
      );

      // Keep the selected peak visible when it belongs to a crowded group.
      const representative = selected ?? group[0];
      const markerElements = records.get(representative.id);

      if (!markerElements) continue;

      visibleIds.add(representative.id);

      updateMountainMarker(
        markerElements,
        group,
        representative,
        Boolean(selected),
      );

      // Groups open a peak list; single peaks open a profile and center the map.
      markerElements.button.onclick = () => {
        if (group.length > 1) {
          onOpenGroup([...group].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          selectedSummitId.current = representative.id;

          onOpenSummit(representative);

          const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 650;

          instance?.easeTo({
            center: representative.coordinates,
            zoom: Math.max(instance.getZoom(), 3.5),
            duration,
          });

          updateClusters();
        }
      };
    }

    // Reuse existing nodes instead of rebuilding markers as the camera moves.
    for (const [id, record] of records)
      record.element.hidden = !visibleIds.has(id);
  }

  // Create every marker once; camera updates only change visibility and labels.
  for (const summit of MOUNTAINS) {
    const markerElements = createMountainMarker(summit);

    records.set(summit.id, markerElements);

    const marker = new mapboxgl.Marker({
      element: markerElements.element,
      anchor: "bottom",
      offset: [0, 24],
      occludedOpacity: 0,
    })
      .setLngLat(summit.coordinates)
      .addTo(instance);

    markers.push(marker);

    markerIndex.set(summit.id, marker);
  }

  updateClusters();

  instance.on("move", updateClusters);
  instance.on("resize", updateClusters);

  // Remove listeners before nodes so camera events cannot update detached markers.
  return () => {
    instance.off("move", updateClusters);
    instance.off("resize", updateClusters);

    removeRangeMarkers();

    markers.forEach((marker) => marker.remove());

    markerIndex.clear();
  };
}
