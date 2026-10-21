import type { Summit } from "../../data/mountains";
import TripTimingFields from "./trip-timing-fields";
import TripExperienceFields from "./trip-experience-fields";
import styles from "./trip-planner.module.css";

// Collects trip timing, party size, objective, and mountain experience.
export default function TripDetailsFields({ summit }: { summit: Summit }) {
  return (
    <>
      <TripTimingFields tripLength={summit.tripLength} />

      <div className={styles.row}>
        <label>
          Travelers
          <input
            name="travelers"
            type="number"
            min={1}
            max={12}
            defaultValue={1}
            required
          />
        </label>
        <label>
          Trip goal
          <select name="objective" defaultValue="visit">
            <option value="visit">Visit &amp; sightseeing</option>
            <option value="trek">Hiking / trekking</option>
            <option value="summit">Summit ascent</option>
          </select>
        </label>
      </div>

      <TripExperienceFields />
    </>
  );
}
