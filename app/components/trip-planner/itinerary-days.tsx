import type { TripPlan } from "../../lib/trip-planner/schema";
import { formatTripDate } from "./format-trip-date";
import styles from "./trip-planner.module.css";

export default function ItineraryDays({
  days,
  dates,
}: {
  days: TripPlan["itinerary"]["days"];
  dates: string[];
}) {
  return (
    <ol className={styles.days}>
      {days.map((day, index) => (
        <li key={dates[index]}>
          <h4>
            Day {index + 1} · {formatTripDate(dates[index])}
          </h4>
          <strong>{day.title}</strong>

          <ul>
            {day.activities.map((activity, activityIndex) => (
              <li key={activityIndex}>{activity}</li>
            ))}
          </ul>

          <p>
            <b>Overnight:</b> {day.overnight}
          </p>
        </li>
      ))}
    </ol>
  );
}
