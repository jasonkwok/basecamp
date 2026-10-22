import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { Summit } from "../../data/mountains";
import { applyMapStyle } from "./map-style";
import { attachMountainMarkers } from "./map-markers";
import {
  getSummitCloseZoom,
  getSummitSelectionZoom,
  MAP_START_CENTER,
  MAX_EXPLORER_ZOOM,
} from "./map-camera";

type Status = "loading" | "ready" | "error";

// Scale the widest view to the viewport so the globe remains screen-sized.
const worldZoom = (width: number) =>
  Math.min(1.3, Math.log2(Math.max(width, 1) / 420)) + 0.4;

// Keep Mapbox resources in refs and user-visible state in React.
export function useMapExplorer() {
  // Refs retain the Mapbox instance and DOM resources without triggering renders.
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);

  const summitMarkers = useRef(new Map<string, Marker>());
  const selectedSummitId = useRef<string | null>(null);

  // Loading and retry state is independent of the currently selected mountain.
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Unfolding your atlas…");
  const [attempt, setAttempt] = useState(0);
  const [mountainPickerOpen, setMountainPickerOpen] = useState(false);
  const [mountainGuideOpen, setMountainGuideOpen] = useState(false);
  const [profileSummit, setProfileSummit] = useState<Summit | null>(null);
  const [nearbySummits, setNearbySummits] = useState<Summit[]>([]);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [returnToPicker, setReturnToPicker] = useState(false);
  const [previousGroup, setPreviousGroup] = useState<{
    summits: Summit[];
    center: [number, number];
    zoom: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    // Ignore late async results and map events after unmount or retry.
    let disposed = false;
    let instance: MapboxMap | undefined;
    let removeMarkers: (() => void) | undefined;

    // Offer recovery if configuration, fonts, or map loading takes too long.
    const timeout = window.setTimeout(() => {
      if (!disposed) {
        setMessage(
          "The map is taking a little longer. Check your connection and try again.",
        );
        setStatus("error");
      }
    }, 25000);

    async function initialize() {
      try {
        // Load the map library and public-token configuration in parallel.
        const [response, { default: mapboxgl }] = await Promise.all([
          fetch("/api/map-config", {
            signal: controller.signal,
            cache: "no-store",
          }),
          import("mapbox-gl"),
        ]);
        const config = await response.json();

        if (!response.ok)
          throw new Error(config.error || "The map could not load.");

        // Map labels use the loaded interface font rather than a fallback font.
        await document.fonts.ready;

        if (disposed || !container.current) return;

        if (!mapboxgl.supported())
          throw new Error(
            "Your browser could not start the interactive map. Try a browser with WebGL enabled.",
          );

        instance = new mapboxgl.Map({
          container: container.current,
          accessToken: config.token,
          // Classic Light exposes individual layers for our illustrated globe.
          style: "mapbox://styles/mapbox/light-v11",
          localFontFamily: getComputedStyle(document.body).fontFamily,
          projection: "globe",
          center: MAP_START_CENTER,
          zoom: Math.min(
            MAX_EXPLORER_ZOOM,
            worldZoom(container.current.clientWidth) + 1.4,
          ),
          minZoom: worldZoom(container.current.clientWidth),
          maxZoom: MAX_EXPLORER_ZOOM,
          bearing: 0,
          pitch: 0,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          attributionControl: true,
        });

        map.current = instance;

        instance.touchZoomRotate.disableRotation();
        instance.keyboard.disableRotation();

        instance.on("wheel", () => setShowTripPlanner(false));
        instance.on("dragstart", () => setShowTripPlanner(false));

        // User navigation dismisses the trip action; selecting a peak reveals it again.
        // Ignore camera animations that center a newly selected mountain.
        instance.on("movestart", (event) => {
          // Resize events also move the camera; keep an open planner on rotation.
          const navigationEvents = [
            "keydown",
            "touchstart",
            "touchmove",
            "wheel",
            "mousedown",
            "mousemove",
          ];
          if (
            event.originalEvent &&
            navigationEvents.includes(event.originalEvent.type)
          ) {
            setShowTripPlanner(false);
          }
        });
        // Recalculate the world-view limit when the viewport changes size.
        instance.on("resize", () => {
          if (!disposed && instance && container.current) {
            instance.setMinZoom(worldZoom(container.current.clientWidth));
          }
        });

        instance
          .getCanvas()
          .setAttribute(
            "aria-label",
            "World map. Use arrow keys to pan and plus or minus to zoom.",
          );

        instance.on("style.load", () => {
          if (!instance || disposed) return;

          applyMapStyle(instance);
        });
        instance.on("load", () => {
          window.clearTimeout(timeout);

          if (!disposed && instance) {
            removeMarkers = attachMountainMarkers({
              instance,
              mapboxgl,
              selectedSummitId,
              markerIndex: summitMarkers.current,
              onOpenGroup: (summits) => {
                setMountainPickerOpen(false);
                setPreviousGroup(null);
                setShowTripPlanner(false);
                setProfileSummit(null);
                setNearbySummits(summits);
              },
              onOpenSummit: (summit) => {
                setMountainPickerOpen(false);
                setPreviousGroup(null);
                setShowTripPlanner(true);
                setNearbySummits([]);
                setProfileSummit(summit);
              },
            });

            setStatus("ready");
          }
        });
        instance.on("error", () => {
          if (disposed) return;

          window.clearTimeout(timeout);

          setMessage(
            "We couldn’t load part of the map. Check your connection and try again.",
          );
          setStatus("error");
        });
      } catch (error) {
        window.clearTimeout(timeout);

        if (!disposed) {
          setMessage(
            error instanceof Error ? error.message : "The map could not load.",
          );
          setStatus("error");
        }
      }
    }

    void initialize();

    return () => {
      // A retry tears down the previous map before initializing a replacement.
      disposed = true;

      controller.abort();

      window.clearTimeout(timeout);

      removeMarkers?.();

      instance?.remove();

      map.current = null;
    };
  }, [attempt]);

  // Picker and nearby-list selections share the same profile and camera behavior.
  function visitSummit(
    summit: Summit,
    group?: Summit[],
    {
      keepGuideOpen = false,
      returnToSearch = false,
    }: { keepGuideOpen?: boolean; returnToSearch?: boolean } = {},
  ) {
    const instance = map.current;

    setMountainPickerOpen(false);
    if (!keepGuideOpen) setMountainGuideOpen(false);

    // Save the group and its camera before centering an individual peak.
    setPreviousGroup(
      group && instance
        ? {
            summits: group,
            center: instance.getCenter().toArray(),
            zoom: instance.getZoom(),
          }
        : null,
    );
    setShowTripPlanner(true);
    setReturnToPicker(returnToSearch);
    setProfileSummit(summit);

    selectedSummitId.current = summit.id;

    setNearbySummits([]);

    for (const [id, marker] of summitMarkers.current) {
      marker.getElement().classList.toggle("is-selected", id === summit.id);
    }

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 900;

    map.current?.easeTo({
      center: summit.coordinates,
      zoom: getSummitSelectionZoom(instance?.getZoom() ?? 0),
      duration,
    });
  }

  function focusMap() {
    map.current?.getCanvas().focus();
  }

  function closeSummitProfile() {
    const instance = map.current;

    selectedSummitId.current = null;
    setProfileSummit(null);
    setShowTripPlanner(false);
    setReturnToPicker(false);
    setPreviousGroup(null);

    if (!instance) return;

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 650;

    instance.easeTo({
      zoom: getSummitCloseZoom(instance.getZoom(), instance.getMinZoom()),
      duration,
    });
  }

  function returnToGroup() {
    if (!previousGroup) return;

    setMountainPickerOpen(false);
    setShowTripPlanner(false);
    setReturnToPicker(false);
    setProfileSummit(null);
    setNearbySummits(previousGroup.summits);
    selectedSummitId.current = null;

    // Restore the original overview rather than keeping the peak's close-up.
    map.current?.easeTo({
      center: previousGroup.center,
      zoom: previousGroup.zoom,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 650,
    });
    setPreviousGroup(null);
  }

  function returnToSearch() {
    if (!returnToPicker) return;

    closeSummitProfile();
    setMountainPickerOpen(true);
  }

  // Opening search replaces any map panel so only one explorer panel is visible.
  function toggleMountainPicker(open: boolean) {
    setMountainPickerOpen(open);

    if (open) {
      setMountainGuideOpen(false);
      setProfileSummit(null);
      setNearbySummits([]);
      setShowTripPlanner(false);
      setReturnToPicker(false);
      setPreviousGroup(null);
    }
  }

  // The chat replaces other explorer panels, keeping the map interaction clear.
  function toggleMountainGuide(open: boolean) {
    setMountainGuideOpen(open);

    if (open) {
      setMountainPickerOpen(false);
      setProfileSummit(null);
      setNearbySummits([]);
      setShowTripPlanner(false);
      setReturnToPicker(false);
      setPreviousGroup(null);
    }
  }

  // Changing the attempt reruns the effect, disposing the previous map first.
  function retry() {
    setStatus("loading");
    setMessage("Unfolding your atlas…");
    setAttempt((previous) => previous + 1);
  }

  return {
    container,
    map,
    status,
    message,
    mountainPickerOpen,
    toggleMountainPicker,
    mountainGuideOpen,
    toggleMountainGuide,
    profileSummit,
    showTripPlanner,
    canReturnToGroup: previousGroup !== null,
    returnToGroup,
    canReturnToSearch: returnToPicker,
    returnToSearch,
    closeSummitProfile,
    setProfileSummit,
    nearbySummits,
    setNearbySummits,
    visitSummit,
    focusMap,
    retry,
  };
}
