"use client";

import MountainPicker from "./mountain-picker";
import MountainProfile from "./mountain-profile";
import NearbyMountains from "./nearby-mountains";
import ExplorerSky from "./explorer-sky";
import ExplorerBrand from "./explorer-brand";
import MapStatus from "./map-status";
import TripPlannerAction from "../trip-planner/trip-planner-action";
import { useMapExplorer } from "./use-map-explorer";
import "mapbox-gl/dist/mapbox-gl.css";

// Compose explorer panels here; the hook owns map resources and shared selection.
export default function MapExplorer() {
  const {
    container,
    status,
    message,
    profileSummit,
    showTripPlanner,
    canReturnToGroup,
    returnToGroup,
    closeSummitProfile,
    setProfileSummit,
    nearbySummits,
    setNearbySummits,
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
            closeSummitProfile();

            // Return keyboard navigation to the globe after leaving a panel.
            focusMap();
          }}
        />
      ) : null}

      <MapStatus status={status} message={message} retry={retry} />
    </main>
  );
}
