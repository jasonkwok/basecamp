import {
  applyRoundTripTimings,
  applySummitOutingTimings,
  validRouteTimings,
  type RouteTime,
} from "../../data/route-times.ts";
import {
  itineraryDuration,
  itineraryGenerationSchema,
  tripPlanSchema,
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
  routeTimes,
}: {
  itinerary: GeneratedItinerary;
  dates: string[];
  requestedDays: number | null;
  routeTimes: RouteTime[];
}): TripPlan {
  if (itinerary.status === "draft" && hasUnestimatedMovement(itinerary)) {
    throw new Error("The itinerary is missing movement-time estimates.");
  }

  const plan = tripPlanSchema.parse({ itinerary, dates });

  if (plan.itinerary.status === "draft") {
    validateRequestedDuration(plan, requestedDays);
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
) {
  const generatedDays = itineraryDuration(plan.itinerary);

  if (requestedDays !== null && generatedDays !== requestedDays) {
    throw new Error("The itinerary did not match the requested trip length.");
  }
}
