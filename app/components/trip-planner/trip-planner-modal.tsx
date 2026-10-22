import { useEffect, useRef } from "react";
import type { MountainCatalogEntry } from "../../data/mountains";
import TripPlannerForm from "./form/trip-planner-form";
import TripPlanResult from "./result/trip-plan-result";
import { useTripPlan } from "./use-trip-plan";
import type { MountainExperience } from "../../lib/mountain-guide/schema";
import styles from "./trip-planner.module.css";

export default function TripPlannerModal({
  summit,
  initialExperience,
  onClose,
}: {
  summit: MountainCatalogEntry | null;
  initialExperience?: MountainExperience;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { pending, error, result, generate, cancel } = useTripPlan();

  function reviewTripDetails() {
    const form = dialog.current?.querySelector<HTMLFormElement>(
      "#trip-planner-form",
    );

    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    form?.querySelector<HTMLElement>("legend")?.focus({ preventScroll: true });
  }

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
        <span>{summit ? `${summit.name} trip planner` : "Trip planner"}</span>
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
        Choose a season or let us suggest when to go. We’ll draft
        a mountain itinerary and packing starter list, using the route’s USD
        budget estimate from Field Notes.
      </p>

      {summit ? (
        <>
          <TripPlannerForm
            summit={summit}
            initialExperience={initialExperience}
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
              onReviewDetails={reviewTripDetails}
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
