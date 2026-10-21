import type { TripPlan } from "../../lib/trip-planner/schema";
import styles from "./trip-planner.module.css";

type Equipment = TripPlan["itinerary"]["equipment"];

const EQUIPMENT_GROUPS: {
  key: keyof Equipment;
  title: string;
  description: string;
}[] = [
  {
    key: "mustHave",
    title: "Must have",
    description: "Essential for the selected route and conditions.",
  },
  {
    key: "importantToHave",
    title: "Important to have",
    description: "Strongly recommended for preparation and practicality.",
  },
];

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
  const hasEquipment = EQUIPMENT_GROUPS.some(
    ({ key }) => items[key].length > 0,
  );

  return (
    <section
      className={styles.equipment}
      aria-labelledby="trip-equipment-title"
    >
      <h4 id="trip-equipment-title">🎒 Equipment Required</h4>
      {hasEquipment ? (
        <>
          <p>
            {referenceOnly
              ? "Equipment reference only. This does not change the warning or make you ready to attempt the climb."
              : "Preparation baseline plus draft suggestions for your selected objective."}{" "}
            This is not a complete checklist. Confirm equipment, team-provided
            items, and seasonal requirements with your guide or operator.
          </p>
          {route ? <p>Route reference: {route}</p> : null}
          {source ? (
            <p>
              Reference:{" "}
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            </p>
          ) : null}
          <div className={styles.equipmentGroups}>
            {EQUIPMENT_GROUPS.map((group) => (
              <section
                key={group.key}
                className={styles.equipmentGroup}
                data-priority={group.key}
                aria-label={group.title}
              >
                <h5>{group.title}</h5>
                <p>{group.description}</p>
                {items[group.key].length ? (
                  <ul>
                    {items[group.key].map((item, index) => (
                      <li key={index}>
                        <EquipmentItem text={item} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.status}>
                    No additional items listed. Confirm requirements for your
                    route.
                  </p>
                )}
              </section>
            ))}
          </div>
        </>
      ) : (
        <p>
          Confirm a suitable trip objective and route before preparing an
          equipment list.
        </p>
      )}
    </section>
  );
}

// Reference entries separate the item name from its compatibility or usage note.
function EquipmentItem({ text }: { text: string }) {
  const separator = text.indexOf(" — ");
  if (separator < 0) return <strong>{text}</strong>;

  return (
    <>
      <strong>{text.slice(0, separator)}</strong>
      <span className={styles.equipmentNote}>
        {" "}
        · {text.slice(separator + 3)}
      </span>
    </>
  );
}
