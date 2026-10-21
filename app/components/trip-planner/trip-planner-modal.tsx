import { useEffect, useRef } from "react";
import type { Summit } from "../../data/mountains";
import TripPlannerForm from "./trip-planner-form";
import TripPlanResult from "./trip-plan-result";
import { useTripPlan } from "./use-trip-plan";
import styles from "./trip-planner.module.css";

export default function TripPlannerModal({
  summit,
  onClose,
}: {
  summit: Summit | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { pending, error, result, generate, cancel } = useTripPlan();

  // Native modal behavior keeps the map inert; restore focus when dismissed.
  useEffect(() => {
    const node = dialog.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    node?.showModal();

    return () => {
      node?.close();
      trigger?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`mountain-guide ${styles.planner}`}
      aria-labelledby="trip-planner-title"
      aria-describedby="trip-planner-description"
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
      onCancel={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        // Escape dismisses the planner without closing its mountain profile.
        if (event.key === "Escape") event.stopPropagation();
      }}
    >
      <div className="guide-topline">
        <span>BASECAMP TRIP PLANNER</span>
        <button
          type="button"
          autoFocus
          aria-label="Close trip planner"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
      </div>

      <h2 id="trip-planner-title">
        {summit ? `Plan your trip to ${summit.name}` : "Plan your adventure"}
      </h2>

      <p className="guide-current">AI-assisted itinerary · Early preview</p>
      {!summit ? (
        <p>
          Choose a mountain from the map or mountain list to start your
          adventure.
        </p>
      ) : null}
      <p id="trip-planner-description">
        Tell us where you’re coming from. Choose exact dates, a rough window, or
        let us suggest when to go. We’ll draft a basic itinerary and packing
        starter list, using the route’s USD budget estimate from Field Notes.
      </p>

      {summit ? (
        <>
          <TripPlannerForm
            summit={summit}
            pending={pending}
            error={error}
            onGenerate={generate}
            onCancel={cancel}
          />
          {result ? (
            <TripPlanResult
              plan={result.plan}
              input={result.input}
              summit={summit}
            />
          ) : null}
          <p className={styles.status}>
            This preview generates suggestions, without live prices or bookings.
            Keep a copy before closing.
          </p>
        </>
      ) : null}
    </dialog>
  );
}
