import { useState } from "react";
import type { MountainCatalogEntry } from "../../data/mountains";
import type { MountainExperience } from "../../lib/mountain-guide/schema";
import TripPlannerModal from "./trip-planner-modal";
import styles from "./trip-planner-action.module.css";

export default function TripPlannerAction({
  summit,
  variant = "prominent",
  initialExperience,
}: {
  summit: MountainCatalogEntry | null;
  variant?: "prominent" | "inline";
  initialExperience?: MountainExperience;
}) {
  const [open, setOpen] = useState(false);
  const isInline = variant === "inline";

  return (
    <>
      <button
        type="button"
        className={isInline ? styles.inlineAction : styles.action}
        aria-haspopup="dialog"
        aria-label={isInline ? `Plan a trip to ${summit?.name}` : undefined}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">📝</span>
        {isInline ? (
          <span>Plan trip</span>
        ) : (
          <span className={styles.copy}>
            <span>Plan your {summit ? `${summit.name} ` : ""}adventure!</span>
            <span className={styles.description}>
              AI-assisted trip planning with a day-by-day itinerary, budget
              considerations, and a packing starter list.
            </span>
          </span>
        )}
      </button>

      {open ? (
        <TripPlannerModal
          summit={summit}
          initialExperience={initialExperience}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
