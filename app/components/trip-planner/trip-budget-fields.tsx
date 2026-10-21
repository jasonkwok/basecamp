import { useState } from "react";
import { CURRENCIES } from "../../lib/trip-planner/schema";
import styles from "./trip-planner.module.css";

export default function TripBudgetFields() {
  // Unknown is a valid choice; an amount is required only for a known budget.
  const [budgetKnown, setBudgetKnown] = useState(false);

  return (
    <>
      <label>
        Budget
        <select
          name="budgetKind"
          aria-label="Budget"
          value={budgetKnown ? "known" : "unknown"}
          onChange={(event) => setBudgetKnown(event.target.value === "known")}
        >
          <option value="unknown">I’m not sure yet</option>
          <option value="known">I have a budget</option>
        </select>
      </label>

      <div className={styles.row}>
        {budgetKnown ? (
          <label>
            Budget per person
            <input
              name="budget"
              type="number"
              min="0.01"
              max={1_000_000}
              step="0.01"
              placeholder="e.g. 2500"
              required
            />
          </label>
        ) : null}
        <label>
          Currency
          <select name="currency" defaultValue="USD">
            {CURRENCIES.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
      </div>
      <small>
        Budget covers the whole trip per person, including transport and gear.
        Unknown is fine.
      </small>
    </>
  );
}
