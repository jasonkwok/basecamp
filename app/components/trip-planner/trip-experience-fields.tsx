import { useId, useState } from "react";
import { MOUNTAIN_EXPERIENCE } from "../../lib/trip-planner/experience-levels";
import type { TripInput } from "../../lib/trip-planner/schema";

type Experience = TripInput["experience"];

export default function TripExperienceFields() {
  const [experience, setExperience] = useState<Experience>("beginner");
  const descriptionId = useId();

  return (
    <>
      <label>
        Mountain experience
        <select
          name="experience"
          aria-label="Mountain experience"
          aria-describedby={descriptionId}
          value={experience}
          onChange={(event) => setExperience(event.target.value as Experience)}
        >
          {Object.entries(MOUNTAIN_EXPERIENCE).map(([value, level]) => (
            <option key={value} value={value}>
              {level.label}
            </option>
          ))}
        </select>
      </label>
      <small id={descriptionId}>
        {MOUNTAIN_EXPERIENCE[experience].description}
      </small>
    </>
  );
}
