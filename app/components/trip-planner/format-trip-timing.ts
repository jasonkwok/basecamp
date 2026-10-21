import {
  SEASON_MONTHS,
  type TripTiming,
} from "../../lib/trip-planner/schema.ts";
import { formatTripDate } from "./format-trip-date.ts";

export function formatTripTiming(timing: TripTiming): string {
  switch (timing.kind) {
    case "exact":
      return `${formatTripDate(timing.departureDate)}–${formatTripDate(timing.returnDate)}`;
    case "window":
      return `Flexible: ${formatTripDate(timing.earliestDeparture)}–${formatTripDate(timing.latestReturn)}`;
    case "season": {
      const years =
        timing.season === "dec-feb"
          ? `${timing.year}–${timing.year + 1}`
          : String(timing.year);
      return `${SEASON_MONTHS[timing.season]} ${years}`;
    }
    case "recommended":
      return "Timing to be recommended";
  }
}
