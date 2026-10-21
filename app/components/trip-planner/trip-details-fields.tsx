import type { Summit } from "../../data/mountains";
import TripTimingFields from "./trip-timing-fields";
import TripExperienceFields from "./trip-experience-fields";
import styles from "./trip-planner.module.css";

// These fields describe the whole trip, including travel from home and back.
export default function TripDetailsFields({ summit }: { summit: Summit }) {
  return (
    <>
      <label>
        Traveling from
        <input
          name="origin"
          placeholder="City and country, e.g. Toronto, Canada"
          autoComplete="off"
          minLength={3}
          maxLength={120}
          required
        />
      </label>

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
