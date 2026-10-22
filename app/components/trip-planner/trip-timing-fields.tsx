import { useState } from "react";
import type { Summit } from "../../data/mountains";
import {
  MAX_TRIP_DAYS,
  SEASON_MONTHS,
} from "../../lib/trip-planner/schema";
import styles from "./trip-planner.module.css";

export default function TripTimingFields({
  tripLength,
}: {
  tripLength: Summit["tripLength"];
}) {
  const [mode, setMode] = useState<"recommended" | "season">("recommended");
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const defaultSeason = seasonForMonth(currentMonth);
  const seasonYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  const durationEstimate =
    tripLength.minDays === tripLength.maxDays
      ? `${tripLength.minDays} ${tripLength.minDays === 1 ? "day" : "days"}`
      : `${tripLength.minDays}–${tripLength.maxDays} days`;

  return (
    <>
      <div className={styles.guidance}>
        <strong>Field Notes estimate: {durationEstimate}</strong>
        <p>{tripLength.context}</p>
        <small>
          This estimate describes the named ascent. Allow extra time for travel
          from home; sightseeing visits may be shorter.
        </small>
      </div>

      <label>
        When would you like to go?
        <select
          name="timingKind"
          aria-label="Travel timing"
          value={mode}
          onChange={(event) =>
            setMode(event.target.value as "recommended" | "season")
          }
        >
          <option value="recommended">Recommend a time for me</option>
          <option value="season">Season / months</option>
        </select>
      </label>

      {mode === "recommended" ? (
        <small>
          We’ll suggest a time of year and explain the assumptions. You can
          choose dates later.
        </small>
      ) : null}

      {mode === "season" ? (
        <>
          <div className={styles.row}>
            <label>
              Season / months
              <select
                name="season"
                aria-label="Season / months"
                defaultValue={defaultSeason}
              >
                {Object.entries(SEASON_MONTHS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Starting year
              <input
                name="year"
                type="number"
                min={currentYear - 1}
                max={2100}
                defaultValue={seasonYear}
                required
              />
            </label>
          </div>
          <small>
            Seasons vary by destination, so choose months. December–February
            ends in the following year.
          </small>
        </>
      ) : null}

      <label>
        Days available (optional)
        <input
          name="durationDays"
          type="number"
          min={1}
          max={MAX_TRIP_DAYS}
          placeholder="Let the planner suggest a length"
        />
      </label>
      <small>
        Include travel from home and back. Leave blank for a suggested length.
        Trips can span up to {MAX_TRIP_DAYS} days. Longer climbs use expedition
        phases with provisional week ranges.
      </small>
    </>
  );
}

function seasonForMonth(month: number): keyof typeof SEASON_MONTHS {
  if (month < 3 || month === 12) return "dec-feb";
  if (month < 6) return "mar-may";
  if (month < 9) return "jun-aug";
  return "sep-nov";
}
