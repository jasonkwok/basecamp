import { getElevationDataNote } from "../../../lib/trip-planner/stage-route-details";
import {
  getMountainBudget,
  formatMountainBudget,
} from "../../../data/mountain-budgets";
import { getRouteProfile } from "../../../data/route-profiles";
import { getRouteTimes } from "../../../data/route-times";
import { useEffect, useRef } from "react";
import {
  getEverestEquipment,
  EVEREST_EQUIPMENT_SOURCE,
} from "../../../lib/trip-planner/everest-equipment";
import type { MountainCatalogEntry } from "../../../data/mountains";
import {
  getEquipmentReference,
  mergeEquipmentReference,
} from "../../../lib/trip-planner/equipment-reference";
import type { TripInput, TripPlan } from "../../../lib/trip-planner/schema";
import ItineraryPhases from "../itinerary/itinerary-phases";
import ItineraryDays from "../itinerary/itinerary-days";
import TripWarnings from "./trip-warnings";
import TripEquipment from "./trip-equipment";
import { formatTripTiming } from "../itinerary/format-trip-timing";
import {
  buildItineraryMarkdown,
  itineraryMarkdownFilename,
} from "../itinerary/itinerary-markdown";
import ItineraryExportActions from "../itinerary/itinerary-export-actions";
import styles from "../trip-planner.module.css";

export default function TripPlanResult({
  plan,
  input,
  summit,
  onReviewDetails,
}: {
  plan: TripPlan;
  input: TripInput;
  summit: MountainCatalogEntry;
  onReviewDetails: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { itinerary, dates } = plan;
  const elevationNote = getElevationDataNote([...itinerary.days, ...itinerary.phases]);
  const budget = getMountainBudget(summit);
  const routeTimes = getRouteTimes(summit.id, input.objective);
  const routeProfile = getRouteProfile(summit, input.objective);
  const routeSources = [...new Set(routeProfile.points.map(({ sourceUrl }) => sourceUrl))];
  const isEverestAscent =
    summit.id === "everest" && input.objective === "summit";
  const reference = isEverestAscent
    ? getEverestEquipment()
    : getEquipmentReference(summit, input.objective);
  const equipment = mergeEquipmentReference(reference, itinerary.equipment);
  const markdown = buildItineraryMarkdown({
    plan,
    input,
    summit,
    equipment,
  });

  useEffect(() => {
    // Announce a completed draft or a request for changes without moving map focus.
    heading.current?.focus();
  }, [plan]);

  return (
    <section className={styles.result} aria-labelledby="itinerary-heading">
      <h3 id="itinerary-heading" ref={heading} tabIndex={-1}>
        {itinerary.status === "needs-changes"
          ? "Let’s adjust your trip"
          : "Your draft itinerary"}
      </h3>
      <TripWarnings warnings={itinerary.warnings} />
      {itinerary.status === "needs-changes" ? (
        <>
          <p className={styles.status} role="status">
            No schedule was created. Review the warning, change your trip
            details, then submit the form again.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={onReviewDetails}>
              Update details and try again
            </button>
          </div>
        </>
      ) : null}

      <p>
        {formatTripTiming(input.timing)} ·{" "}
        {input.travelers} traveler
        {input.travelers === 1 ? "" : "s"}
      </p>
      <p>{itinerary.summary}</p>

      {itinerary.status === "draft" ? (
        <ItineraryExportActions
          markdown={markdown}
          filename={itineraryMarkdownFilename(summit.name)}
        />
      ) : null}

      <p className={styles.status}>{itinerary.timingNote}</p>
      {elevationNote ? <p className={styles.status}>{elevationNote}</p> : null}

      {itinerary.phases.length ? (
        <ItineraryPhases
          phases={itinerary.phases}
          dates={dates}
          routeTimes={routeTimes}
        />
      ) : null}

      {itinerary.days.length ? (
        <ItineraryDays
          days={itinerary.days}
          dates={dates}
          routeTimes={routeTimes}
        />
      ) : null}

      <TripEquipment
        items={equipment}
        source={isEverestAscent ? EVEREST_EQUIPMENT_SOURCE : undefined}
        referenceOnly={itinerary.status === "needs-changes"}
        route={
          input.objective === "summit" ? summit.difficulty.ascent : undefined
        }
      />

      <details className={styles.planningNotes}>
        <summary>Budget &amp; planning notes</summary>
        <p>
          <strong>{formatMountainBudget(budget)}</strong> per person · {budget.basis}
        </p>
        <p>{itinerary.budgetNote}</p>
        {itinerary.assumptions.length ? (
          <ul>{itinerary.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul>
        ) : null}
        {routeSources.length ? (
          <p>
            Elevations are route benchmarks; camp locations can vary.{" "}
            {routeSources.map((url, index) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">Source {index + 1} ↗{" "}</a>
            ))}
          </p>
        ) : null}
      </details>
      <p className={styles.status}>
        Planning draft; route access and conditions are not checked live.
        Export to keep a copy.
      </p>
    </section>
  );
}
