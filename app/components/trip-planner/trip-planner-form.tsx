import type { FormEvent } from "react";
import type { TripInput } from "../../lib/trip-planner/schema";
import TripDetailsFields from "./trip-details-fields";
import TripBudgetFields from "./trip-budget-fields";
import styles from "./trip-planner.module.css";

export default function TripPlannerForm({
  mountainId,
  pending,
  onGenerate,
  onCancel,
}: {
  mountainId: string;
  pending: boolean;
  onGenerate: (input: TripInput) => void;
  onCancel: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fields = new FormData(event.currentTarget);
    onGenerate(readTripInput(fields, mountainId));
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset disabled={pending}>
        <legend>Your trip details</legend>

        <TripDetailsFields />

        <TripBudgetFields />
      </fieldset>

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
      <p role="status" className={styles.status}>
        {pending
          ? "Drafting your travel days and mountain visit. This may take up to a minute."
          : ""}
      </p>
    </form>
  );
}

// Convert browser form strings once; the hook validates against the shared schema.
function readTripInput(fields: FormData, mountainId: string): TripInput {
  const budgetKnown = fields.get("budgetKind") === "known";

  return {
    mountainId,
    origin: String(fields.get("origin")),
    departureDate: String(fields.get("departureDate")),
    returnDate: String(fields.get("returnDate")),
    travelers: Number(fields.get("travelers")),
    objective: fields.get("objective") as TripInput["objective"],
    experience: fields.get("experience") as TripInput["experience"],
    currency: fields.get("currency") as TripInput["currency"],
    budget: budgetKnown
      ? { kind: "known", amount: Number(fields.get("budget")) }
      : { kind: "unknown" },
  };
}
