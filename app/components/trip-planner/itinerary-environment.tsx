import type { ItineraryEnvironment } from "../../lib/trip-planner/schema";
import styles from "./trip-planner.module.css";

export default function ItineraryEnvironmentNotes({
  environment,
}: {
  environment: ItineraryEnvironment;
}) {
  return (
    <dl className={styles.environment}>
      <div>
        <dt>Altitude</dt>
        <dd>{environment.altitude}</dd>
      </div>
      <div>
        <dt>Typical temperature</dt>
        <dd>{environment.temperature}</dd>
      </div>
      <div>
        <dt>Conditions</dt>
        <dd>{environment.conditions}</dd>
      </div>
    </dl>
  );
}
