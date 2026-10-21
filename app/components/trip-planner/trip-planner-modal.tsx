import { useEffect, useRef } from "react";
import type { Summit } from "../../data/mountains";

export default function TripPlannerModal({
  summit,
  onClose,
}: {
  summit: Summit | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

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
      className="mountain-guide trip-planner"
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

      <p className="guide-current">WIP · Work in progress</p>
      {!summit ? (
        <p>Choose a mountain from the map or mountain list to start your adventure.</p>
      ) : null}
      <p id="trip-planner-description">
        Your next adventure is taking shape. Trip planning is coming soon, with
        personalized itineraries and packing lists to help you prepare.
      </p>
    </dialog>
  );
}
