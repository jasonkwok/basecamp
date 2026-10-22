import { createMockItinerary } from "../../lib/trip-planner/mock-itinerary";
import { MOUNTAINS } from "../../data/mountains";
import { getRouteTimes } from "../../data/route-times";
import { generateItinerary } from "../../lib/trip-planner/generate-itinerary";
import { describeGenerationError } from "../../lib/trip-planner/generation-error";
import { allowTripGeneration } from "../../lib/trip-planner/rate-limit";
import { readTripRequest } from "../../lib/trip-planner/request";
import {
  assessTripSuitability,
  createUnsuitableTripPlan,
} from "../../lib/trip-planner/trip-suitability";
import {
  tripPlanSchema,
  tripDates,
  tripInputSchema,
  MAX_TRIP_DAYS,
} from "../../lib/trip-planner/schema";

export const maxDuration = 60;

const responseHeaders = { "Cache-Control": "no-store" };

function failure(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: responseHeaders },
  );
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return failure("Open the planner from Basecamp to generate a trip.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return failure("Send trip details as JSON.", 415);
  }

  try {
    // Reject invalid preferences and catalog IDs before consuming a generation slot.
    const validation = tripInputSchema.safeParse(
      await readTripRequest(request),
    );

    if (!validation.success)
      return failure(validation.error.issues[0].message, 400);

    const preferences = validation.data;

    const summit = MOUNTAINS.find(
      (mountain) => mountain.id === preferences.mountainId,
    );
    if (!summit) return failure("Choose a mountain from the catalog.", 400);

    // An experience mismatch is returned before quota checks or any paid AI call.
    const warning = assessTripSuitability(preferences, summit);
    if (warning) {
      const timing = preferences.timing;
      const dates =
        timing.kind === "exact"
          ? tripDates(timing.departureDate, timing.returnDate)
          : [];
      return Response.json(createUnsuitableTripPlan(warning, dates), {
        headers: responseHeaders,
      });
    }

    // Mock mode is server-controlled and disabled in production. Safety checks
    // above stay real, so an unsuitable ascent never receives a mock schedule.
    const mockMode =
      process.env.NODE_ENV === "development" && process.env.TRIP_PLANNER_MOCK;
    if (mockMode) {
      if (mockMode === "error")
        return failure(
          "Mock generation failure. Your details are still here—please try again.",
          503,
        );
      if (mockMode === "invalid") {
        // Exercise the same schema-failure recovery used for malformed model output.
        tripPlanSchema.parse({
          itinerary: { summary: "Invalid mock response" },
        });
      }
      if (mockMode !== "success")
        return failure(
          "Unknown TRIP_PLANNER_MOCK scenario. Use success, error, or invalid.",
          503,
        );

      const timing = preferences.timing;
      const dates =
        timing.kind === "exact"
          ? tripDates(timing.departureDate, timing.returnDate)
          : [];
      const requestedDays =
        timing.kind === "exact"
          ? dates.length
          : (timing.durationDays ??
            (preferences.objective === "summit"
              ? Math.min(MAX_TRIP_DAYS, summit.tripLength.minDays + 4)
              : 3));
      const dayCount = Math.min(requestedDays, MAX_TRIP_DAYS);
      const plan = tripPlanSchema.parse(
        createMockItinerary(
          preferences,
          summit,
          dates,
          dayCount,
          getRouteTimes(summit.id, preferences.objective),
        ),
      );
      return Response.json(plan, { headers: responseHeaders });
    }

    const requesterId =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (!allowTripGeneration(requesterId)) {
      return failure(
        "You’ve reached the limit of 50 drafts per hour. Try again later.",
        429,
      );
    }

    const plan = await generateItinerary(preferences, summit, request.signal);
    return Response.json(plan, { headers: responseHeaders });
  } catch (error) {
    const { message, status } = describeGenerationError(error);
    return failure(message, status);
  }
}
