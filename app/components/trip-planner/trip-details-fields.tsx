import { MAX_TRIP_DAYS } from "../../lib/trip-planner/schema";
import styles from "./trip-planner.module.css";

// These fields describe the whole trip, including travel from home and back.
export default function TripDetailsFields() {
  const today = new Date().toISOString().slice(0, 10);

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

      <div className={styles.row}>
        <label>
          Departure date
          <input name="departureDate" type="date" min={today} required />
        </label>
        <label>
          Return date
          <input name="returnDate" type="date" min={today} required />
        </label>
      </div>
      <small>
        Include travel from home and back. Plan trips up to {MAX_TRIP_DAYS}{" "}
        days.
      </small>

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

      <label>
        Mountain experience
        <select name="experience" defaultValue="beginner">
          <option value="beginner">New to mountain trips</option>
          <option value="regular">Regular hiker</option>
          <option value="technical">Technical mountaineering experience</option>
        </select>
      </label>
    </>
  );
}
