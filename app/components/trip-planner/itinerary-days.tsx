import type { RouteTime } from "../../data/route-times";
import MovementTimes from "./movement-times";
import ItineraryEnvironmentNotes from "./itinerary-environment";
import type { TripPlan } from "../../lib/trip-planner/schema";
import { formatTripDate } from "./format-trip-date";
import styles from "./trip-planner.module.css";

export default function ItineraryDays({
  days,
  dates,
  routeTimes,
}: {
  days: TripPlan["itinerary"]["days"];
  dates: string[];
  routeTimes: RouteTime[];
}) {
  return (
    <section aria-labelledby="daily-itinerary-title">
      <h4 id="daily-itinerary-title" className={styles.itinerarySectionTitle}>
        Day-by-day itinerary
      </h4>
      <ol className={styles.days}>
        {days.map((day, index) => (
          <li key={dates[index] ?? index}>
            <h4>
              Day {index + 1}
              {dates[index] ? ` · ${formatTripDate(dates[index])}` : ""}
            </h4>
            <strong>{day.title}</strong>

            <ul>
              {day.activities.map((activity, activityIndex) => (
                <li key={activityIndex}>{activity}</li>
              ))}
            </ul>

            <ItineraryEnvironmentNotes environment={day.environment} />
            <MovementTimes items={day.effort} references={routeTimes} />

            <p>
              <b>Overnight:</b> {day.overnight}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
