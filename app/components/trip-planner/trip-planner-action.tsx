import { useState } from "react";
import type { Summit } from "../../data/mountains";
import TripPlannerModal from "./trip-planner-modal";
import styles from "./trip-planner-action.module.css";

export default function TripPlannerAction({
  summit,
}: {
  summit: Summit | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.action}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">📝</span>
        <span className={styles.copy}>
          <span>Plan your {summit ? `${summit.name} ` : ""}adventure!</span>
          <span className={styles.description}>
            AI-assisted trip planning with a day-by-day itinerary, budget
            considerations, and a packing starter list.
          </span>
        </span>
      </button>

      {open ? (
        <TripPlannerModal summit={summit} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
