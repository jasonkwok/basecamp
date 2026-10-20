"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { MOUNTAINS, type Summit } from "../data/mountains";
import { MOUNTAIN_TAGS, type MountainTagId } from "../data/mountain-tags";
import MountainProfile from "./mountain-profile";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "../data/difficulty-levels";
import { clusterMountains } from "./cluster-mountains";
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
  const [profileSummit, setProfileSummit] = useState<Summit | null>(null);
  const [nearbySummits, setNearbySummits] = useState<Summit[]>([]);
  const nearbyHeading = useRef<HTMLHeadingElement>(null);
  const selectedSummitId = useRef<string | null>(null);
  const [collection, setCollection] = useState<MountainTagId | "all">("all");
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | "all">("all");
  const [altitudeFilter, setAltitudeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const summitMarkers = useRef(new Map<string, Marker>());
  const regions = [...new Set(MOUNTAINS.map((summit) => summit.region))].sort();
  const listedSummits = MOUNTAINS.filter((summit) => {
    const matchesTag = collection === "all" || summit.tags.includes(collection);
    const matchesDifficulty = difficultyFilter === "all" || summit.difficulty.level === difficultyFilter;
    const matchesAltitude = altitudeFilter === "all" || (altitudeFilter === "under-2500" ? summit.elevationMeters < 2500 : altitudeFilter === "8000-plus" ? summit.elevationMeters >= 8000 : altitudeFilter === "2500-3999" ? summit.elevationMeters >= 2500 && summit.elevationMeters < 4000 : altitudeFilter === "4000-5999" ? summit.elevationMeters >= 4000 && summit.elevationMeters < 6000 : summit.elevationMeters >= 6000 && summit.elevationMeters < 8000);
    const matchesRegion = regionFilter === "all" || summit.region === regionFilter;
    const haystack = `${summit.name} ${summit.region} ${summit.location} ${summit.description} ${summit.tags.map((tag) => MOUNTAIN_TAGS[tag].label).join(" ")} ${DIFFICULTY_LEVELS[summit.difficulty.level].label}`.toLocaleLowerCase();
    return matchesTag && matchesDifficulty && matchesAltitude && matchesRegion && haystack.includes(search.trim().toLocaleLowerCase());
  });
  const hasActiveFilters = Boolean(search || collection !== "all" || difficultyFilter !== "all" || altitudeFilter !== "all" || regionFilter !== "all");
  const [atMaxZoom, setAtMaxZoom] = useState(false);
  const [atMinZoom, setAtMinZoom] = useState(true);

  useEffect(() => {
    if (nearbySummits.length) nearbyHeading.current?.focus();
  }, [nearbySummits]);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let instance: MapboxMap | undefined;
    const markers: Marker[] = [];
    const markerIndex = summitMarkers.current;
    const records = new Map<string, {
      element: HTMLDivElement; button: HTMLButtonElement; name: HTMLSpanElement;
      badges: HTMLSpanElement; nearby: HTMLSpanElement;
    }>();
    function updateClusters() {
      if (!instance || disposed || records.size === 0) return;
      const center = instance.getCenter();
      const radians = Math.PI / 180;
      const centerLat = center.lat * radians;
      const { clientWidth: width, clientHeight: height } = instance.getContainer();
      const points = MOUNTAINS.flatMap((summit) => {
        const latitude = summit.coordinates[1] * radians;
        const longitudeDelta = (summit.coordinates[0] - center.lng) * radians;
        const facing = Math.sin(latitude) * Math.sin(centerLat) + Math.cos(latitude) * Math.cos(centerLat) * Math.cos(longitudeDelta);
        const point = instance!.project(summit.coordinates);
        if (facing <= 0 || point.x < -200 || point.x > width + 200 || point.y < -200 || point.y > height + 200) return [];
        return [{ summit, x: point.x, y: point.y }];
      });
      const visibleIds = new Set<string>();
      for (const group of clusterMountains(points)) {
        const selected = group.find((summit) => summit.id === selectedSummitId.current);
        const representative = selected ?? group[0];
        const record = records.get(representative.id)!;
        visibleIds.add(representative.id);
        const isGroup = group.length > 1;
        record.element.classList.toggle("is-selected", Boolean(selected));
        record.element.dataset.clusterCount = String(group.length);
        record.name.textContent = selected || !isGroup ? representative.name : `${group.length} peaks`;
        record.badges.hidden = isGroup && !selected;
        record.nearby.hidden = !isGroup;
        record.nearby.textContent = selected ? `+${group.length - 1} nearby · explore` : "See nearby mountains";
        record.button.setAttribute("aria-label", isGroup ? `${group.length} nearby peaks. ${group.map((summit) => summit.name).join(", ")}` : `${representative.name}, ${representative.region}. ${representative.tags.map((tag) => MOUNTAIN_TAGS[tag].description).join(". ")}`);
        record.button.onclick = () => {
          if (isGroup) {
            setProfileSummit(null);
            setNearbySummits([...group].sort((a, b) => a.name.localeCompare(b.name)));
          } else {
            selectedSummitId.current = representative.id;
            setNearbySummits([]);
            setProfileSummit(representative);
            const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
            instance?.easeTo({ center: representative.coordinates, zoom: Math.max(instance.getZoom(), 3.5), duration });
            updateClusters();
          }
        };
      }
      for (const [id, record] of records) record.element.hidden = !visibleIds.has(id);
    }
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
          zoom: Math.min(MAX_EXPLORER_ZOOM, worldZoom(container.current.clientWidth) + 1.4),
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
            for (const summit of MOUNTAINS) {
              const element = document.createElement("div");
              element.className = "mountain-marker";
              element.dataset.summitId = summit.id;
              const button = document.createElement("button");
              button.type = "button";
              button.className = "mountain-hit-area";
              const illustration = document.createElement("img");
              illustration.src = "/mountain-marker.svg";
              illustration.alt = "";
              illustration.width = 112;
              illustration.height = 90;
              const label = document.createElement("span");
              label.className = "mountain-label";
              const name = document.createElement("span");
              name.textContent = summit.name;
              const badges = document.createElement("span");
              badges.className = "mountain-badges";
              for (const tagId of summit.tags) {
                const tag = MOUNTAIN_TAGS[tagId];
                const badge = document.createElement("span");
                badge.className = "mountain-badge";
                badge.dataset.tag = tagId;
                badge.title = tag.description;
                const icon = document.createElement("span");
                icon.className = "badge-emblem";
                icon.textContent = tag.icon;
                const text = document.createElement("span");
                text.textContent = tag.label;
                badge.append(icon, text);
                badges.append(badge);
              }
              const nearby = document.createElement("span");
              const difficulty = DIFFICULTY_LEVELS[summit.difficulty.level];
              const difficultyBadge = document.createElement("span");
              difficultyBadge.className = "mountain-badge difficulty-badge";
              difficultyBadge.dataset.difficulty = summit.difficulty.level;
              difficultyBadge.textContent = `${difficulty.icon} ${difficulty.label}`;
              difficultyBadge.title = `${difficulty.fullLabel} · ${summit.difficulty.ascent}`;
              badges.append(difficultyBadge);
              nearby.className = "mountain-nearby";
              nearby.hidden = true;
              label.append(name, badges, nearby);
              const location = document.createElement("span");
              location.className = "mountain-location";
              button.append(illustration, location, label);
              element.append(button);
              records.set(summit.id, { element, button, name, badges, nearby });
              const marker = new mapboxgl.Marker({
                element, anchor: "bottom", offset: [0, 24],
                occludedOpacity: 0,
              }).setLngLat(summit.coordinates).addTo(instance);
              markers.push(marker);
              markerIndex.set(summit.id, marker);
            }
            updateClusters();
            instance.on("move", updateClusters);
            instance.on("resize", updateClusters);
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
      markers.forEach((marker) => marker.remove());
      markerIndex.clear();
      instance?.remove();
      map.current = null;
    };
  }, [attempt]);

  function reset() {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
    const width = container.current?.clientWidth ?? 1200;
    map.current?.easeTo({ center: [12, 20], zoom: worldZoom(width), bearing: 0, pitch: 0, duration });
  }

  function visitSummit(summit: Summit) {
    setProfileSummit(summit);
    selectedSummitId.current = summit.id;
    setNearbySummits([]);
    for (const [id, marker] of summitMarkers.current) {
      marker.getElement().classList.toggle("is-selected", id === summit.id);
    }
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    map.current?.easeTo({ center: summit.coordinates, zoom: 3.5, duration });
  }

  return (
    <main className="explorer" aria-label="Basecamp map explorer">
      <div className="star-field" aria-hidden="true">
        <div className="sky-sun">☀️</div>
        <div className="sky-moon">🌙</div>
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
      <details className="summit-picker" onToggle={(event) => {
        if (event.currentTarget.open) { setProfileSummit(null); setNearbySummits([]); }
      }}>
        <summary>🏔️ Mountains · {MOUNTAINS.length} <span aria-hidden="true">⌃</span></summary>
        <div className="summit-menu">
          <p>Search peaks, then narrow by tag, challenge, height or region.</p>
          <input className="summit-search" type="search" aria-label="Search mountains" placeholder="Search mountains…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="summit-filters">
            <select aria-label="Filter by tag" value={collection} onChange={(event) => setCollection(event.target.value as MountainTagId | "all")}>
              <option value="all">All tags · {MOUNTAINS.length}</option>
              {Object.entries(MOUNTAIN_TAGS).map(([id, tag]) => <option key={id} value={id}>{tag.icon} {tag.label} · {MOUNTAINS.filter((summit) => summit.tags.includes(id as MountainTagId)).length}</option>)}
            </select>
            <select aria-label="Filter by difficulty" value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as DifficultyLevel | "all")}>
              <option value="all">All difficulties</option>
              {Object.entries(DIFFICULTY_LEVELS).map(([id, level]) => <option key={id} value={id}>{level.icon} {level.label}</option>)}
            </select>
            <select aria-label="Filter by elevation" value={altitudeFilter} onChange={(event) => setAltitudeFilter(event.target.value)}>
              <option value="all">Any elevation</option><option value="under-2500">Under 2,500 m</option><option value="2500-3999">2,500–3,999 m</option><option value="4000-5999">4,000–5,999 m</option><option value="6000-7999">6,000–7,999 m</option><option value="8000-plus">8,000 m+</option>
            </select>
            <select aria-label="Filter by region" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
              <option value="all">All regions</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </div>
          <div className="summit-result-row"><small className="summit-result-count" aria-live="polite">Showing {listedSummits.length} of {MOUNTAINS.length} peaks</small>{hasActiveFilters ? <button className="summit-clear-filters" onClick={() => { setSearch(""); setCollection("all"); setDifficultyFilter("all"); setAltitudeFilter("all"); setRegionFilter("all"); }}>Clear filters</button> : null}</div>
          <ul>{listedSummits.map((summit) => {
            const difficulty = DIFFICULTY_LEVELS[summit.difficulty.level];
            return <li key={summit.id}><button className="summit-option" disabled={status !== "ready"} onClick={(event) => {
              visitSummit(summit);
              const picker = event.currentTarget.closest("details");
              if (picker) picker.open = false;
            }}><span className="summit-option-heading"><strong>{summit.name}</strong><small>{summit.region} · {summit.elevationMeters.toLocaleString()} m</small></span><span className="summit-option-badges">{summit.tags.map((tag) => <span key={tag} className="mountain-badge" data-tag={tag} title={MOUNTAIN_TAGS[tag].description}>{MOUNTAIN_TAGS[tag].icon} {MOUNTAIN_TAGS[tag].label}</span>)}<span className="mountain-badge difficulty-badge" data-difficulty={summit.difficulty.level} title={summit.difficulty.ascent}>{difficulty.icon} {difficulty.label}</span></span></button></li>;
          })}{listedSummits.length === 0 ? <li className="summit-empty">No peaks match these filters. Try widening your search.</li> : null}</ul>
          <small className="summit-note">7 Summits · 14 eight-thousanders · {MOUNTAINS.filter((summit) => summit.tags.includes("popular")).length} popular picks</small>
        </div>
      </details>
      {nearbySummits.length > 0 ? <section className="nearby-panel" aria-labelledby="nearby-heading" onKeyDown={(event) => {
        if (event.key === "Escape") { setNearbySummits([]); map.current?.getCanvas().focus(); }
      }}>
        <div className="nearby-header"><h2 id="nearby-heading" ref={nearbyHeading} tabIndex={-1}>{nearbySummits.length} nearby peaks</h2><button aria-label="Close nearby peaks" onClick={() => { setNearbySummits([]); map.current?.getCanvas().focus(); }}>×</button></div>
        <p>A whole range of possibilities. Pick a mountain to bring it into view.</p>
        <ul>{nearbySummits.map((summit) => <li key={summit.id}><button onClick={() => { visitSummit(summit); map.current?.getCanvas().focus(); }}>
          <strong>{summit.name}</strong><span className="nearby-badges">{summit.tags.map((tag) => <span key={tag} className="mountain-badge" data-tag={tag}>{MOUNTAIN_TAGS[tag].icon} {MOUNTAIN_TAGS[tag].label}</span>)}</span>
        </button></li>)}</ul>
      </section> : null}
      {profileSummit ? <MountainProfile summit={profileSummit} onClose={() => { setProfileSummit(null); map.current?.getCanvas().focus(); }} /> : null}
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
