"use client";

import MountainPicker from "./mountain-picker";
import MountainProfile from "./mountain-profile";
import NearbyMountains from "./nearby-mountains";
import ExplorerSky from "./explorer-sky";
import ExplorerBrand from "./explorer-brand";
import MapControls from "./map-controls";
import TripPlannerAction from "../trip-planner/trip-planner-action";
import { useMapExplorer } from "./use-map-explorer";
import "mapbox-gl/dist/mapbox-gl.css";

// Compose explorer panels here; the hook owns map resources and shared selection.
export default function MapExplorer() {
  const {
    container,
    map,
    status,
    message,
    help,
    setHelp,
    profileSummit,
    showTripPlanner,
    canReturnToGroup,
    returnToGroup,
    setProfileSummit,
    nearbySummits,
    setNearbySummits,
    atMaxZoom,
    atMinZoom,
    reset,
    visitSummit,
    focusMap,
    retry,
  } = useMapExplorer();

  return (
    <main className="explorer" aria-label="Basecamp map explorer">
      <ExplorerSky />

      <div className="map-surface" ref={container} />

      <ExplorerBrand />

      {profileSummit && showTripPlanner ? (
        <TripPlannerAction key={profileSummit.id} summit={profileSummit} />
      ) : null}

      <MountainPicker
        ready={status === "ready"}
        onOpen={() => {
          // Opening search clears other panels so they do not compete for space.
          setProfileSummit(null);
          setNearbySummits([]);
        }}
        onSelect={visitSummit}
      />

      {nearbySummits.length > 0 ? (
        <NearbyMountains
          nearbySummits={nearbySummits}
          onClose={() => {
            setNearbySummits([]);

            // Return keyboard navigation to the globe after leaving a panel.
            focusMap();
          }}
          onSelect={(summit) => {
            visitSummit(summit, nearbySummits);
          }}
        />
      ) : null}

      {profileSummit ? (
        <MountainProfile
          summit={profileSummit}
          onBack={canReturnToGroup ? returnToGroup : undefined}
          onClose={() => {
            setProfileSummit(null);

            // Return keyboard navigation to the globe after leaving a panel.
            focusMap();
          }}
        />
      ) : null}

      <MapControls
        map={map}
        status={status}
        message={message}
        atMaxZoom={atMaxZoom}
        atMinZoom={atMinZoom}
        help={help}
        setHelp={setHelp}
        reset={reset}
        retry={retry}
      />
    </main>
  );
}
