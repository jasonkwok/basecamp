"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Status = "loading" | "ready" | "error";
const MAX_EXPLORER_ZOOM = 5;
const worldZoom = (width: number) => Math.min(1.3, Math.log2(Math.max(width, 1) / 420)) + 0.4;

export default function MapExplorer() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Unfolding your atlas…");
  const [attempt, setAttempt] = useState(0);
  const [help, setHelp] = useState(false);
  const [atMaxZoom, setAtMaxZoom] = useState(false);
  const [atMinZoom, setAtMinZoom] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let instance: MapboxMap | undefined;
    const timeout = window.setTimeout(() => {
      if (!disposed) {
        setMessage("The map is taking a little longer. Check your connection and try again.");
        setStatus("error");
      }
    }, 25000);

    async function initialize() {
      try {
        const [response, { default: mapboxgl }] = await Promise.all([
          fetch("/api/map-config", { signal: controller.signal, cache: "no-store" }),
          import("mapbox-gl"),
        ]);
        const config = await response.json();
        if (!response.ok) throw new Error(config.error || "The map could not load.");
        await document.fonts.ready;
        if (disposed || !container.current) return;
        if (!mapboxgl.supported()) throw new Error("Your browser could not start the interactive map. Try a browser with WebGL enabled.");
        instance = new mapboxgl.Map({
          container: container.current,
          accessToken: config.token,
          // Classic Light exposes individual layers for our illustrated globe.
          style: "mapbox://styles/mapbox/light-v11",
          localFontFamily: getComputedStyle(document.body).fontFamily,
          projection: "globe",
          center: [12, 20],
          zoom: Math.min(MAX_EXPLORER_ZOOM, worldZoom(container.current.clientWidth) + 0.5),
          minZoom: worldZoom(container.current.clientWidth), maxZoom: MAX_EXPLORER_ZOOM,
          bearing: 0, pitch: 0,
          dragRotate: false, pitchWithRotate: false, touchPitch: false,
          attributionControl: true,
        });
        map.current = instance;
        instance.touchZoomRotate.disableRotation();
        instance.keyboard.disableRotation();
        instance.on("zoomend", () => {
          if (!disposed && instance) {
            setAtMaxZoom(instance.getZoom() >= MAX_EXPLORER_ZOOM - 0.01);
            setAtMinZoom(instance.getZoom() <= instance.getMinZoom() + 0.01);
          }
        });
        instance.on("resize", () => {
          if (!disposed && instance && container.current) {
            instance.setMinZoom(worldZoom(container.current.clientWidth));
            setAtMinZoom(instance.getZoom() <= instance.getMinZoom() + 0.01);
          }
        });
        instance.getCanvas().setAttribute("aria-label", "World map. Use arrow keys to pan and plus or minus to zoom.");
        instance.on("style.load", () => {
          if (!instance || disposed) return;
          instance.setFog({
            color: "rgba(64, 89, 111, 0)",
            "high-color": "rgba(64, 89, 111, 0)",
            "space-color": "rgba(64, 89, 111, 0)",
            "horizon-blend": 0,
            "star-intensity": 0,
          });
          for (const layer of instance.getStyle().layers ?? []) {
            if (layer.type === "background") instance.setPaintProperty(layer.id, "background-color", "#3f7055");
            if (layer.type === "fill" && layer.id === "water") {
              instance.setPaintProperty(layer.id, "fill-color", "#b4dbd1");
              instance.setPaintProperty(layer.id, "fill-outline-color", "#e5f2cf");
            }
            if (layer.type === "fill" && /landuse|landcover|national-park/.test(layer.id)) instance.setPaintProperty(layer.id, "fill-color", "#578767");
            if (layer.type === "line" && layer.id.startsWith("admin-")) {
              if (/admin-1|boundary-bg/.test(layer.id)) {
                instance.setLayoutProperty(layer.id, "visibility", "none");
              } else {
                instance.setPaintProperty(layer.id, "line-color", "#b6d3a5");
                instance.setPaintProperty(layer.id, "line-opacity", 0.45);
                instance.setPaintProperty(layer.id, "line-width", 1);
                instance.setLayoutProperty(layer.id, "line-join", "round");
                instance.setLayoutProperty(layer.id, "line-cap", "round");
              }
            }
            // Keep a geographic overview for mountain discovery at every zoom.
            if (/road|bridge|tunnel|building|poi|transit|airport|settlement|state-label|natural-point-label/.test(layer.id)) {
              instance.setLayoutProperty(layer.id, "visibility", "none");
            }
            if (layer.type === "symbol" && layer.layout?.["text-field"]) {
              const waterLabel = layer.id.startsWith("water-");
              instance.setPaintProperty(layer.id, "text-color", waterLabel ? "#3f7055" : "#fffbee");
              instance.setPaintProperty(layer.id, "text-halo-color", waterLabel ? "#b4dbd1" : "#3f7055");
              instance.setPaintProperty(layer.id, "text-halo-width", 2);
              instance.setLayoutProperty(layer.id, "text-font", ["DIN Pro Bold", "Arial Unicode MS Bold"]);
              instance.setLayoutProperty(layer.id, "text-padding", 12);
              if (layer.id === "country-label") {
                instance.setLayoutProperty(layer.id, "text-size", ["interpolate", ["linear"], ["zoom"], 1, 11, 3, 14, 5, 18]);
              }
            }
          }
        });
        instance.on("load", () => {
          window.clearTimeout(timeout);
          if (!disposed && instance) {
            setAtMinZoom(instance.getZoom() <= instance.getMinZoom() + 0.01);
            setAtMaxZoom(instance.getZoom() >= MAX_EXPLORER_ZOOM - 0.01);
            setStatus("ready");
          }
        });
        instance.on("error", () => {
          if (disposed) return;
          window.clearTimeout(timeout);
          setMessage("We couldn’t load part of the map. Check your connection and try again.");
          setStatus("error");
        });
      } catch (error) {
        window.clearTimeout(timeout);
        if (!disposed) {
          setMessage(error instanceof Error ? error.message : "The map could not load.");
          setStatus("error");
        }
      }
    }
    void initialize();
    return () => {
      disposed = true;
      controller.abort();
      window.clearTimeout(timeout);
      instance?.remove();
      map.current = null;
    };
  }, [attempt]);

  function reset() {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
    const width = container.current?.clientWidth ?? 1200;
    map.current?.easeTo({ center: [12, 20], zoom: worldZoom(width), bearing: 0, pitch: 0, duration });
  }

  return (
    <main className="explorer" aria-label="Basecamp map explorer">
      <div className="star-field" aria-hidden="true">
        {[
          [7, 24], [21, 12], [38, 8], [61, 11], [83, 19], [94, 36],
          [12, 48], [29, 34], [77, 40], [88, 58], [5, 72], [20, 83],
          [39, 91], [65, 87], [77, 75], [95, 88], [52, 5], [47, 78],
        ].map(([left, top], index) => (
          <span key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%` }}>
            {index % 3 === 0 ? "✨" : "⭐"}
          </span>
        ))}
      </div>
      <div className="map-surface" ref={container} />
      <header className="atlas-brand">
        <span className="brand-mark" aria-hidden="true">🏔️</span>
        <div><h1>Basecamp<span className="brand-dot">.</span></h1><p>Your next adventure starts here.</p></div>
      </header>
      <nav className="map-tools" aria-label="Map controls">
        <div className="zoom-tools">
          <button aria-label="Zoom in" title={atMaxZoom ? "Closest explorer view" : "Zoom in"} disabled={status !== "ready" || atMaxZoom} onClick={() => map.current?.zoomIn({ duration: 0 })}>+</button>
          <button aria-label="Zoom out" title={atMinZoom ? "Widest world view" : "Zoom out"} disabled={status !== "ready" || atMinZoom} onClick={() => map.current?.zoomOut({ duration: 0 })}>−</button>
        </div>
        <button disabled={status !== "ready"} onClick={reset}>↖ World view</button>
        <button aria-expanded={help} aria-controls="map-help" onClick={() => setHelp(!help)}>How to explore</button>
      </nav>
      {help ? <section id="map-help" className="help-card" aria-label="Map help">
        <h2>Around the world</h2><p>Drag to pan. Pinch or scroll to zoom. With the map focused, use arrow keys and + / −. Zoom stops at a regional overview to keep exploration simple.</p>
        <p>You can also tap a direction:</p>
        <div className="pan-tools">{([
          ["←", "west", [120, 0]], ["↑", "north", [0, 120]],
          ["↓", "south", [0, -120]], ["→", "east", [-120, 0]],
        ] as const).map(([icon, direction, offset]) => <button key={direction} aria-label={`Pan ${direction}`} disabled={status !== "ready"} onClick={() => map.current?.panBy([offset[0], offset[1]], { duration: 0 })}>{icon}</button>)}</div>
      </section> : null}
      {status !== "ready" ? <div className="map-status" role={status === "error" ? "alert" : "status"}>
        <span aria-hidden="true">{status === "loading" ? "◎" : "☁"}</span>
        <h2>{status === "loading" ? "Adventure is on the horizon" : "A small detour"}</h2>
        <p>{message}</p>
        {status === "error" ? <button onClick={() => { setStatus("loading"); setMessage("Unfolding your atlas…"); setAttempt(attempt + 1); }}>Try again</button> : null}
      </div> : null}
    </main>
  );
}
