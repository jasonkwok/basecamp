export default function ItineraryStageEquipment({
  items,
}: {
  items: string[] | null;
}) {
  return (
    <p>
      <b>Required equipment:</b>{" "}
      {items === null
        ? "Not specified in this draft."
        : items.length
          ? items.join("; ")
          : "No climbing equipment required for this stage."}
    </p>
  );
}
