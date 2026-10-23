import ItineraryRouteDetails from "./itinerary-route-details";
import type { RouteTime } from "../../../data/route-times";
import MovementTimes from "./movement-times";
import ItineraryEnvironmentNotes from "./itinerary-environment";
import type { TripPlan } from "../../../lib/trip-planner/schema";
import { formatTripDate } from "./format-trip-date";
import styles from "../trip-planner.module.css";

export default function ItineraryPhases({
  phases,
  dates,
  routeTimes,
}: {
  phases: TripPlan["itinerary"]["phases"];
  dates: string[];
  routeTimes: RouteTime[];
}) {
  return (
    <section aria-labelledby="expedition-phases-title">
      <h4 id="expedition-phases-title">Route stages</h4>
      <p className={styles.status}>
        Progress depends on recovery and route conditions. Elevation changes
        describe each movement, not cumulative climbing over the phase.
      </p>
      <ol className={styles.days}>
        {phases.map((phase) => (
          <li key={phase.startDay}>
            <p className={styles.phaseRange}>
              {formatPhaseRange(phase.startDay, phase.endDay)}
            </p>
            <h4>{phase.title}</h4>
            {dates.length ? (
              <p className={styles.status}>
                {formatTripDate(dates[phase.startDay - 1])} –{" "}
                {formatTripDate(dates[phase.endDay - 1])}
              </p>
            ) : null}
            <ul>
              {phase.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
            <ItineraryRouteDetails details={phase.routeDetails} />
            <ItineraryEnvironmentNotes environment={phase.environment} showAltitude={phase.routeDetails.altitudeChanges.length === 0 && /\d/.test(phase.environment.altitude)} />
            <MovementTimes items={phase.effort} references={routeTimes} />

            <p>
              <b>Stay:</b> {phase.overnight}
            </p>
            <p className={styles.phaseDecision}>
              <b>Before moving on:</b> {phase.decisionNote}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatPhaseRange(startDay: number, endDay: number) {
  const firstWeek = Math.ceil(startDay / 7);
  const lastWeek = Math.ceil(endDay / 7);
  const weeks =
    firstWeek === lastWeek
      ? `Week ${firstWeek}`
      : `Weeks ${firstWeek}–${lastWeek}`;
  const days =
    startDay === endDay ? `Day ${startDay}` : `Days ${startDay}–${endDay}`;
  return `${weeks} · ${days}`;
}
