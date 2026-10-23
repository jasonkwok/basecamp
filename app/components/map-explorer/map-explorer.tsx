"use client";

import { useState } from "react";
import MountainPicker from "./mountain-selection/mountain-picker";
import MountainProfile from "./mountain-profile/mountain-profile";
import NearbyMountains from "./mountain-selection/nearby-mountains";
import ExplorerSky from "./chrome/explorer-sky";
import ExplorerBrand from "./chrome/explorer-brand";
import MapStatus from "./map/map-status";
import SummitProgressBadge from "./summit-progress/summit-progress-badge";
import MountainGuideChat from "./mountain-guide/mountain-guide-chat";
import TripPlannerAction from "../trip-planner/trip-planner-action";
import type { MountainExperience } from "../../lib/mountain-guide/schema";
import { useMapExplorer } from "./map/use-map-explorer";
import "mapbox-gl/dist/mapbox-gl.css";

// Compose explorer panels here; the hook owns map resources and shared selection.
export default function MapExplorer() {
  // Carry the guide's experience level into itinerary planning for its picks.
  const [plannerExperience, setPlannerExperience] =
    useState<MountainExperience>();
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
    closePeakGroup,
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
        onToggle={toggleMountainGuide}
        onOpenSearch={() => toggleMountainPicker(true)}
        hasSelectedMountain={profileSummit !== null}
        onSelectMountain={(summit, experience) => {
          setPlannerExperience(experience);
          visitSummit(summit);
        }}
      />

      {profileSummit && showTripPlanner ? (
        <TripPlannerAction
          key={profileSummit.id}
          summit={profileSummit}
          initialExperience={plannerExperience}
        />
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
            closePeakGroup();

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
          plannerExperience={plannerExperience}
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
