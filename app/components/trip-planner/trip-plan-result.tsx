import { useEffect, useRef } from "react";
import type { TripInput, TripPlan } from "../../lib/trip-planner/schema";
import ItineraryDays from "./itinerary-days";
import { formatTripDate } from "./format-trip-date";
import styles from "./trip-planner.module.css";

export default function TripPlanResult({
  plan,
  input,
}: {
  plan: TripPlan;
  input: TripInput;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { itinerary, dates } = plan;

  useEffect(() => {
    // Announce a completed draft or a request for changes without moving map focus.
    heading.current?.focus();
  }, [plan]);

  return (
    <section className={styles.result} aria-labelledby="itinerary-heading">
      <h3 id="itinerary-heading" ref={heading} tabIndex={-1}>
        {itinerary.status === "needs-changes"
          ? "Let’s adjust your trip"
          : "Your draft itinerary"}
      </h3>
      <p>
        From {input.origin} · {formatTripDate(input.departureDate)}–
        {formatTripDate(input.returnDate)} · {input.travelers} traveler
        {input.travelers === 1 ? "" : "s"}
      </p>
      <p>{itinerary.summary}</p>

      <h4>Budget considerations</h4>
      <p>{itinerary.budgetNote}</p>

      {itinerary.days.length ? (
        <ItineraryDays days={itinerary.days} dates={dates} />
      ) : null}

      {itinerary.equipment.length ? (
        <>
          <h4>Packing starter list</h4>
          <ul>
            {itinerary.equipment.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}

      {itinerary.assumptions.length ? (
        <>
          <h4>Assumptions &amp; things to confirm</h4>
          <ul>
            {itinerary.assumptions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      <p className={styles.status}>
        AI-generated planning draft. Transport, prices, route access, and
        conditions have not been checked live. Not saved after closing.
      </p>
    </section>
  );
}
