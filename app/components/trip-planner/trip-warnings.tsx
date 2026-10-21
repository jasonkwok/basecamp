import { useId } from "react";
import type { TripWarning } from "../../lib/trip-planner/trip-suitability";
import styles from "./trip-planner.module.css";

export default function TripWarnings({
  warnings,
}: {
  warnings: TripWarning[];
}) {
  const titleId = useId();
  if (!warnings.length) return null;

  const isCritical = warnings.some(
    (warning) => warning.severity === "critical",
  );

  return (
    <section
      className={styles.warnings}
      data-critical={isCritical}
      aria-labelledby={titleId}
      role={isCritical ? "alert" : undefined}
    >
      <h4 id={titleId}>⚠️ Warnings</h4>
      {warnings.map((warning, index) => (
        <div key={index}>
          <strong>{warning.title}</strong>
          <p>{warning.message}</p>
        </div>
      ))}
    </section>
  );
}
