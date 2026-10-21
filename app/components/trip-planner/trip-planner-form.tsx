import { useEffect, useRef, type FormEvent } from "react";
import type { Summit } from "../../data/mountains";
import { readTripTiming } from "./read-trip-timing";
import type { TripInput } from "../../lib/trip-planner/schema";
import TripDetailsFields from "./trip-details-fields";
import styles from "./trip-planner.module.css";

export default function TripPlannerForm({
  summit,
  pending,
  error,
  onGenerate,
  onCancel,
}: {
  summit: Summit;
  pending: boolean;
  error: string | null;
  onGenerate: (input: TripInput) => void;
  onCancel: () => void;
}) {
  const errorMessage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Bring validation and generation failures into view without losing form values.
    if (error) errorMessage.current?.focus();
  }, [error]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fields = new FormData(event.currentTarget);
    onGenerate(readTripInput(fields, summit.id));
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset disabled={pending}>
        <legend>Your trip details</legend>

        <TripDetailsFields summit={summit} />
      </fieldset>

      {error ? (
        <div
          ref={errorMessage}
          className={styles.error}
          role="alert"
          tabIndex={-1}
        >
          <strong>We couldn’t create your draft</strong>
          <p>{error}</p>
          <small>You can edit any field before retrying.</small>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" disabled={pending}>
          {pending ? "Creating your itinerary…" : "Generate basic itinerary"}
        </button>
        {pending ? (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      <p role="status" className={styles.progress}>
        {pending
          ? "Drafting your travel days and mountain visit. This may take up to a minute."
          : ""}
      </p>
    </form>
  );
}

// Convert browser form strings once; the hook validates against the shared schema.
function readTripInput(fields: FormData, mountainId: string): TripInput {
  return {
    mountainId,
    origin: String(fields.get("origin")),
    timing: readTripTiming(fields),
    travelers: Number(fields.get("travelers")),
    objective: fields.get("objective") as TripInput["objective"],
    experience: fields.get("experience") as TripInput["experience"],
    // Cost context comes from the selected mountain, not a form constraint.
    currency: "USD",
    budget: { kind: "unknown" },
  };
}
