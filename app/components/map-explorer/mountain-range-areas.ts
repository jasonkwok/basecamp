import type { Map as MapboxMap } from "mapbox-gl";
import { MOUNTAIN_RANGES, type MountainRange } from "../../data/mountain-ranges";

const RANGE_SOURCE_ID = "mountain-range-areas";
const RANGE_FILL_LAYER_ID = "mountain-range-areas-fill";
const RANGE_OUTLINE_LAYER_ID = "mountain-range-areas-outline";

// Outline broad range areas so the map markers inside them read as a group.
export function addMountainRangeAreas(instance: MapboxMap) {
  const data = {
    type: "FeatureCollection",
    features: MOUNTAIN_RANGES.map((range) => ({
      type: "Feature",
      properties: { rangeId: range.id, name: range.name },
      geometry: {
        type: "Polygon",
        coordinates: [createRangeOutline(range)],
      },
    })),
  };

  instance.addSource(RANGE_SOURCE_ID, { type: "geojson", data });

  const firstSymbolLayer = instance
    .getStyle()
    .layers?.find((layer) => layer.type === "symbol")?.id;

  instance.addLayer(
    {
      id: RANGE_FILL_LAYER_ID,
      type: "fill",
      source: RANGE_SOURCE_ID,
      paint: {
        "fill-color": "#ffd48a",
        "fill-opacity": 0,
      },
    },
    firstSymbolLayer,
  );

  instance.addLayer(
    {
      id: RANGE_OUTLINE_LAYER_ID,
      type: "line",
      source: RANGE_SOURCE_ID,
      paint: {
        "line-color": "#edaa69",
        "line-opacity": 0.58,
        "line-width": 2.5,
        "line-dasharray": [0.5, 1.5],
      },
    },
    firstSymbolLayer,
  );

  return {
    setVisible(visible: boolean) {
      const visibility = visible ? "visible" : "none";
      instance.setLayoutProperty(RANGE_FILL_LAYER_ID, "visibility", visibility);
      instance.setLayoutProperty(
        RANGE_OUTLINE_LAYER_ID,
        "visibility",
        visibility,
      );
    },
    remove() {
      instance.removeLayer(RANGE_OUTLINE_LAYER_ID);
      instance.removeLayer(RANGE_FILL_LAYER_ID);
      instance.removeSource(RANGE_SOURCE_ID);
    },
  };
}

// Add intermediate coordinates so large boundaries follow the globe's curve.
function createRangeOutline(range: MountainRange): [number, number][] {
  const { west, east, south, north } = range.bounds;
  const corners: [number, number][] = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  const outline: [number, number][] = [];

  for (let edge = 0; edge < corners.length - 1; edge++) {
    const [startLongitude, startLatitude] = corners[edge];
    const [endLongitude, endLatitude] = corners[edge + 1];

    for (let step = 0; step < 24; step++) {
      const progress = step / 24;
      outline.push([
        startLongitude + (endLongitude - startLongitude) * progress,
        startLatitude + (endLatitude - startLatitude) * progress,
      ]);
    }
  }

  outline.push(corners[corners.length - 1]);

  return outline;
}
