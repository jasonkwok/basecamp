import type { TripTiming } from "../../lib/trip-planner/schema";

// Empty duration means "suggest a length", never zero days or an invented date.
export function readTripTiming(fields: FormData): TripTiming {
  const kind = fields.get("timingKind");
  const duration = fields.get("durationDays");
  const durationDays = duration ? Number(duration) : null;

  switch (kind) {
    case "exact":
      return {
        kind,
        departureDate: String(fields.get("startDate")),
        returnDate: String(fields.get("endDate")),
      };
    case "season":
      return {
        kind,
        season: fields.get("season") as Extract<
          TripTiming,
          { kind: "season" }
        >["season"],
        year: Number(fields.get("year")),
        durationDays,
      };
    default:
      return { kind: "recommended", durationDays };
  }
}
