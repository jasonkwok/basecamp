import type { Map as MapboxMap } from "mapbox-gl";

// Apply the adventure atlas palette while keeping street-level detail hidden.
export function applyMapStyle(map: MapboxMap) {
  map.setFog({
    color: "rgba(64, 89, 111, 0)",
    "high-color": "rgba(64, 89, 111, 0)",
    "space-color": "rgba(64, 89, 111, 0)",
    "horizon-blend": 0,
    "star-intensity": 0,
  });

  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === "background")
      map.setPaintProperty(layer.id, "background-color", "#3f7055");

    if (layer.type === "fill" && layer.id === "water") {
      map.setPaintProperty(layer.id, "fill-color", "#b4dbd1");
      map.setPaintProperty(layer.id, "fill-outline-color", "#e5f2cf");
    }

    if (
      layer.type === "fill" &&
      /landuse|landcover|national-park/.test(layer.id)
    )
      map.setPaintProperty(layer.id, "fill-color", "#578767");

    if (layer.type === "line" && layer.id.startsWith("admin-")) {
      if (/admin-1|boundary-bg/.test(layer.id)) {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } else {
        map.setPaintProperty(layer.id, "line-color", "#b6d3a5");
        map.setPaintProperty(layer.id, "line-opacity", 0.45);
        map.setPaintProperty(layer.id, "line-width", 1);
        map.setLayoutProperty(layer.id, "line-join", "round");
        map.setLayoutProperty(layer.id, "line-cap", "round");
      }
    }

    // Keep a geographic overview for mountain discovery at every zoom.
    if (
      /road|bridge|tunnel|building|poi|transit|airport|settlement|state-label|natural-point-label/.test(
        layer.id,
      )
    ) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }

    if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      const waterLabel = layer.id.startsWith("water-");

      map.setPaintProperty(
        layer.id,
        "text-color",
        waterLabel ? "#3f7055" : "#fffbee",
      );
      map.setPaintProperty(
        layer.id,
        "text-halo-color",
        waterLabel ? "#b4dbd1" : "#3f7055",
      );
      map.setPaintProperty(layer.id, "text-halo-width", 2);
      map.setLayoutProperty(layer.id, "text-font", [
        "DIN Pro Bold",
        "Arial Unicode MS Bold",
      ]);
      map.setLayoutProperty(layer.id, "text-padding", 12);

      if (layer.id === "country-label") {
        map.setLayoutProperty(layer.id, "text-size", [
          "interpolate",
          ["linear"],
          ["zoom"],
          1,
          11,
          3,
          14,
          5,
          18,
        ]);
      }
    }
  }
}
