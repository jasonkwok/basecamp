import "server-only";
import { getRouteProfile } from "../../data/route-profiles";
import {
  getRouteTimes,
} from "../../data/route-times";
import { generateText, Output } from "ai";
import {
  buildItineraryPrompt,
  ITINERARY_INSTRUCTIONS,
} from "./itinerary-prompt";
import type { MountainCatalogEntry } from "../../data/mountains";
import {
  itineraryGenerationSchema,
  tripDates,
  type TripInput,
} from "./schema";
import {
  hasUnestimatedMovement,
  prepareGeneratedItinerary,
  validateGeneratedItinerary,
} from "./validate-generated-itinerary";

// Use one structured-output call and retry once if movement estimates are missing.
export const DEFAULT_TRIP_MODEL = "openai/gpt-4.1-mini";

export async function generateItinerary(
  input: TripInput,
  summit: MountainCatalogEntry,
  signal: AbortSignal,
) {
  const { timing } = input;
  const dates =
    timing.kind === "exact"
      ? tripDates(timing.departureDate, timing.returnDate)
      : [];
  const requestedDays =
    timing.kind === "exact" ? dates.length : timing.durationDays;
  const routeTimes = getRouteTimes(summit.id, input.objective);
  const routeProfile = getRouteProfile(summit, input.objective);
  const prompt = buildItineraryPrompt(input, summit, dates);
  let result = await requestItinerary(prompt, signal);
  let itinerary = prepareGeneratedItinerary(result.output, routeTimes, routeProfile);

  // A missing movement estimate gets one focused correction before returning a draft.
  if (hasUnestimatedMovement(itinerary)) {
    result = await requestItinerary(
      `${prompt}\n\nCorrection required: every hiking, mountaineering, or technical-climbing effort without a supplied route-time reference must have a one-hour estimatedHours range. Use null only for travel/rest or a supplied timingId.`,
      signal,
      15_000,
    );
    itinerary = prepareGeneratedItinerary(result.output, routeTimes, routeProfile);
  }

  const plan = validateGeneratedItinerary({
    itinerary,
    dates,
    requestedDays,
    routeTimes,
  });

  // Record only operational metadata, never travel preferences or generated content.
  console.info("Trip itinerary generated", {
    model: result.finalStep.response.modelId,
    inputTokens: result.totalUsage.inputTokens,
    outputTokens: result.totalUsage.outputTokens,
  });

  return plan;
}

function requestItinerary(
  prompt: string,
  signal: AbortSignal,
  timeout = 40_000,
) {
  return generateText({
    model: process.env.AI_GATEWAY_MODEL || DEFAULT_TRIP_MODEL,
    output: Output.object({ schema: itineraryGenerationSchema }),
    maxOutputTokens: 7000,
    maxRetries: 0,
    timeout,
    abortSignal: signal,
    system: ITINERARY_INSTRUCTIONS,
    prompt,
  });
}
