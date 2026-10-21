import type { RouteTime } from "../../data/route-times";
import type { TripPlan } from "../../lib/trip-planner/schema";
import styles from "./trip-planner.module.css";

type Effort = TripPlan["itinerary"]["days"][number]["effort"];
const ACTIVITY_LABELS = {
  hiking: "Hiking",
  mountaineering: "Mountaineering",
  "technical-climbing": "Technical climbing",
  rest: "Rest / waiting",
  travel: "Travel",
};

export default function MovementTimes({
  items,
  references,
}: {
  items: Effort;
  references: RouteTime[];
}) {
  const movementItems = items.filter(
    (item) => item.activity !== "rest" && item.activity !== "travel",
  );

  if (!movementItems.length) return null;

  return (
    <div className={styles.movement}>
      <b>Hiking &amp; climbing time</b>
      <ul>
        {movementItems.map((item, index) => {
          const timing = references.find(
            (reference) =>
              reference.id === item.timingId &&
              reference.activity === item.activity,
          );
          const estimatedTime = item.estimatedHours;
          return (
            <li key={index}>
              <strong>{timing?.label ?? item.label}</strong>
              <span>
                {ACTIVITY_LABELS[item.activity]} ·{" "}
                {timing
                  ? `${timing.minHours}–${timing.maxHours} hours · ${timing.scope}`
                  : estimatedTime
                    ? `Approx. ${estimatedTime.replace("-", "–")} hours`
                    : "Timing unavailable · confirm with your guide"}
              </span>
              {timing ? (
                <a href={timing.sourceUrl} target="_blank" rel="noreferrer">
                  Route-time source ↗
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
