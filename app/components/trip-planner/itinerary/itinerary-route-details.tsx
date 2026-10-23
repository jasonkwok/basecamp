import type { StageRouteDetails } from "../../../lib/trip-planner/schema";
import { formatAltitudeChange } from "../../../lib/trip-planner/stage-route-details";
import styles from "../trip-planner.module.css";

export default function ItineraryRouteDetails({ details }: { details: StageRouteDetails }) {
  const elevations = details.altitudeChanges.filter(({ fromMeters, toMeters }) =>
    fromMeters !== null || toMeters !== null,
  );
  const hasChanges = elevations.some(({ fromMeters, toMeters }) => fromMeters !== null && toMeters !== null);

  return (
    <div className={styles.routeDetails}>
      <p><b>Difficulty:</b> {details.difficulty}</p>
      {elevations.length ? (
        <>
          <b>{hasChanges ? "Altitude changes" : "Known elevations"}</b>
          <ul>
            {elevations.map((movement, index) => {
              const formatted = formatAltitudeChange(movement);
              return (
                <li key={index}>
                  <span>{formatted.route}</span>
                  {formatted.change ? <strong>{formatted.change}</strong> : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
