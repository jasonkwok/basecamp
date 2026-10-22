import {
  getMountainBudget,
  formatMountainBudget,
} from "../../../data/mountain-budgets";
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
  const budget = getMountainBudget(summit);
  const routeTimes = getRouteTimes(summit.id, input.objective);
  const summitElevationFeet = Math.round(
    summit.elevationMeters * 3.28084,
  ).toLocaleString("en-US");
  const summitElevationMeters = Math.round(
    summit.elevationMeters,
  ).toLocaleString("en-US");
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
      {input.objective === "summit" ? (
        <p className={styles.status}>
          Summit elevation: {summitElevationFeet} ft ({summitElevationMeters} m).
          Daily route and overnight elevations are listed when verified.
        </p>
      ) : null}

      {itinerary.status === "draft" ? (
        <ItineraryExportActions
          markdown={markdown}
          filename={itineraryMarkdownFilename(summit.name)}
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

      <h4>Travel timing</h4>
      <p>{itinerary.timingNote}</p>
      {input.timing.kind !== "exact" ? (
        <p className={styles.status}>
          Flexible draft · Timing is provisional; no travel dates have been
          assigned.
        </p>
      ) : null}

      <h4>Route budget reference</h4>
      <p>
        <strong>{formatMountainBudget(budget)}</strong> per person ·{" "}
        {budget.basis}
      </p>

      <p className={styles.status}>
        Planning for {input.travelers} traveler
        {input.travelers === 1 ? "" : "s"}. The group total can vary because
        shared costs depend on party size.
      </p>

      <p>{itinerary.budgetNote}</p>

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

      {itinerary.status === "draft" ? (
        <p className={styles.status}>
          Movement times are estimates of time on the route; breaks, weather,
          and conditions can change the total day length.
        </p>
      ) : null}

      {itinerary.assumptions.length ? (
        <>
          <h4>Assumptions &amp; things to confirm</h4>
          <ul>
            {itinerary.assumptions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      <p className={styles.status}>
        AI-generated planning draft. Transport, prices, route access, and
        conditions have not been checked live. Export a copy to keep it; Basecamp
        does not retain plans after closing.
      </p>
    </section>
  );
}
