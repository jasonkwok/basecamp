import { filterClimbingEquipment } from "../../../lib/trip-planner/equipment-reference";
import type { TripPlan } from "../../../lib/trip-planner/schema";
import styles from "../trip-planner.module.css";

type Equipment = TripPlan["itinerary"]["equipment"];
const PREVIEW_LIMIT = 10;

export default function TripEquipment({
  items,
  referenceOnly = false,
  route,
  source,
}: {
  items: Equipment;
  referenceOnly?: boolean;
  route?: string;
  source?: { label: string; url: string };
}) {
  const gear = filterClimbingEquipment(items);
  const previewEssentials = gear.mustHave.length > 0;
  const preview = (previewEssentials ? gear.mustHave : gear.importantToHave).slice(0, PREVIEW_LIMIT);
  const remaining = previewEssentials ? gear.mustHave.slice(PREVIEW_LIMIT) : [];
  const important = previewEssentials ? gear.importantToHave : gear.importantToHave.slice(PREVIEW_LIMIT);
  const total = gear.mustHave.length + gear.importantToHave.length;
  const more = total - preview.length;

  return (
    <section className={styles.equipment} aria-labelledby="trip-equipment-title">
      <h4 id="trip-equipment-title">🎒 Climbing equipment <small>{total} items</small></h4>
      <p>
        {referenceOnly
          ? "Reference only; this does not change the climb warning."
          : "Route gear only; confirm specifications and team supplies with your guide."}
      </p>
      {preview.length > 0 ? (
        <>
          <h5>{previewEssentials ? "Must have" : "Important to have"}</h5>
          <EquipmentList items={preview} />
        </>
      ) : null}
      {more > 0 || route || source ? (
        <details className={styles.equipmentDisclosure}>
          <summary>{more > 0 ? `Show climbing gear · ${more} more items` : "Route reference"}</summary>
          <div className={styles.equipmentGroups}>
            {remaining.length > 0 ? (
              <section className={styles.equipmentGroup} aria-label="More must-have equipment">
                <h5>More must have</h5>
                <EquipmentList items={remaining} />
              </section>
            ) : null}
            {important.length > 0 ? (
              <section className={styles.equipmentGroup} aria-label="Important to have">
                <h5>Important to have</h5>
                <EquipmentList items={important} />
              </section>
            ) : null}
          </div>
          {route ? <p>Route: {route}</p> : null}
          {source ? <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a> : null}
        </details>
      ) : null}
      {total === 0 ? <p>No climbing equipment listed for this objective.</p> : null}
    </section>
  );
}

function EquipmentList({ items }: { items: string[] }) {
  return <ul>{items.map((item, index) => <li key={index}><EquipmentItem text={item} /></li>)}</ul>;
}

function EquipmentItem({ text }: { text: string }) {
  const separator = text.indexOf(" — ");
  if (separator < 0) return <strong>{text}</strong>;
  return <>
    <strong>{text.slice(0, separator)}</strong>
    <span className={styles.equipmentNote}> · {text.slice(separator + 3)}</span>
  </>;
}
