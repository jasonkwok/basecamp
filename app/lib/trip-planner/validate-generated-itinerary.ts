import {
  applyRoundTripTimings,
  applySummitOutingTimings,
  validRouteTimings,
  type RouteTime,
} from "../../data/route-times.ts";
import {
  calendarDayCount,
  itineraryDuration,
  itineraryGenerationSchema,
  tripPlanSchema,
  type TripInput,
  type TripPlan,
} from "./schema.ts";

export type GeneratedItinerary = ReturnType<
  typeof itineraryGenerationSchema.parse
>;

export function prepareGeneratedItinerary(
  itinerary: GeneratedItinerary,
  routeTimes: RouteTime[],
) {
  if (itinerary.warnings.some((warning) => warning.severity === "critical")) {
    itinerary.status = "needs-changes";
    itinerary.days = [];
    itinerary.phases = [];
    itinerary.equipment = { mustHave: [], importantToHave: [], niceToHave: [] };
  } else if (itinerary.status === "draft") {
    const stages = [...itinerary.days, ...itinerary.phases];
    applySummitOutingTimings(stages, routeTimes);
    applyRoundTripTimings(stages, routeTimes);
  }

  return itinerary;
}

export function hasUnestimatedMovement(itinerary: GeneratedItinerary) {
  const stages = [...itinerary.days, ...itinerary.phases];

  return stages.some((stage) =>
    stage.effort.some(
      (effort) =>
        effort.activity !== "rest" &&
        effort.activity !== "travel" &&
        effort.timingId === null &&
        effort.estimatedHours === null,
    ),
  );
}

export function validateGeneratedItinerary({
  itinerary,
  dates,
  requestedDays,
  timing,
  routeTimes,
}: {
  itinerary: GeneratedItinerary;
  dates: string[];
  requestedDays: number | null;
  timing: TripInput["timing"];
  routeTimes: RouteTime[];
}): TripPlan {
  if (itinerary.status === "draft" && hasUnestimatedMovement(itinerary)) {
    throw new Error("The itinerary is missing movement-time estimates.");
  }

  const plan = tripPlanSchema.parse({ itinerary, dates });

  if (plan.itinerary.status === "draft") {
    validateRequestedDuration(plan, requestedDays, timing);
  }

  const stages = [...plan.itinerary.days, ...plan.itinerary.phases];
  if (!validRouteTimings(stages, routeTimes)) {
    throw new Error("The movement timing reference did not match this route.");
  }

  return plan;
}

function validateRequestedDuration(
  plan: TripPlan,
  requestedDays: number | null,
  timing: TripInput["timing"],
) {
  const generatedDays = itineraryDuration(plan.itinerary);

  if (requestedDays !== null && generatedDays !== requestedDays) {
    throw new Error("The itinerary did not match the requested trip length.");
  }

  if (
    timing.kind === "window" &&
    generatedDays >
      calendarDayCount(timing.earliestDeparture, timing.latestReturn)
  ) {
    throw new Error("The itinerary exceeded the available travel window.");
  }
}
