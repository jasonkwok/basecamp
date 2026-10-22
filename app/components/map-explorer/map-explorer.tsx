"use client";

import MountainPicker from "./mountain-picker";
import MountainProfile from "./mountain-profile";
import NearbyMountains from "./nearby-mountains";
import ExplorerSky from "./explorer-sky";
import ExplorerBrand from "./explorer-brand";
import MapStatus from "./map-status";
import SummitProgressBadge from "./summit-progress-badge";
import MountainGuideChat from "./mountain-guide-chat";
import TripPlannerAction from "../trip-planner/trip-planner-action";
import { useMapExplorer } from "./use-map-explorer";
import "mapbox-gl/dist/mapbox-gl.css";

// Compose explorer panels here; the hook owns map resources and shared selection.
export default function MapExplorer() {
  const {
    container,
    status,
    message,
    mountainPickerOpen,
    toggleMountainPicker,
    mountainGuideOpen,
    toggleMountainGuide,
    profileSummit,
    showTripPlanner,
    canReturnToGroup,
    returnToGroup,
    canReturnToSearch,
    returnToSearch,
    closeSummitProfile,
    nearbySummits,
    setNearbySummits,
    visitSummit,
    focusMap,
    retry,
  } = useMapExplorer();

  return (
    <main
      className="explorer"
      aria-label="Basecamp map explorer"
      data-mountain-guide-open={mountainGuideOpen}
      data-mountain-profile-open={profileSummit !== null}
    >
      <ExplorerSky />

      <div className="map-surface" ref={container} />

      <ExplorerBrand />

      <SummitProgressBadge onSelect={visitSummit} />

      <MountainGuideChat
        open={mountainGuideOpen}
        available={
          !profileSummit && nearbySummits.length === 0
        }
        onToggle={toggleMountainGuide}
        onOpenSearch={() => toggleMountainPicker(true)}
        hasSelectedMountain={profileSummit !== null}
        onSelectMountain={(summit) =>
          visitSummit(summit, undefined, { keepGuideOpen: true })
        }
      />

      {profileSummit && showTripPlanner && !mountainGuideOpen ? (
        <TripPlannerAction key={profileSummit.id} summit={profileSummit} />
      ) : null}

      <MountainPicker
        ready={status === "ready"}
        open={mountainPickerOpen}
        onToggle={toggleMountainPicker}
        onSelect={(summit) =>
          visitSummit(summit, undefined, { returnToSearch: true })
        }
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
          onBack={
            canReturnToSearch
              ? returnToSearch
              : canReturnToGroup
                ? returnToGroup
                : undefined
          }
          backLabel={canReturnToSearch ? "Back to search" : "Back to nearby peaks"}
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
