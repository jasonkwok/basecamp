import { MOUNTAINS } from "../../data/mountains";
import { generateItinerary } from "../../lib/trip-planner/generate-itinerary";
import { describeGenerationError } from "../../lib/trip-planner/generation-error";
import { allowTripGeneration } from "../../lib/trip-planner/rate-limit";
import { readTripRequest } from "../../lib/trip-planner/request";
import { tripInputSchema } from "../../lib/trip-planner/schema";

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

    const requesterId =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (!allowTripGeneration(requesterId)) {
      return failure(
        "You’ve reached the limit of five drafts per hour. Try again later.",
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
