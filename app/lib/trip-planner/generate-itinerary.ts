import "server-only";
import { generateText, Output } from "ai";
import {
  buildItineraryPrompt,
  ITINERARY_INSTRUCTIONS,
} from "./itinerary-prompt";
import type { Summit } from "../../data/mountains";
import {
  itinerarySchema,
  tripDates,
  tripPlanSchema,
  type TripInput,
} from "./schema";

// A small structured-output model keeps this single-call MVP fast and inexpensive.
export const DEFAULT_TRIP_MODEL = "openai/gpt-4.1-mini";

export async function generateItinerary(
  input: TripInput,
  summit: Summit,
  signal: AbortSignal,
) {
  const dates = tripDates(input.departureDate, input.returnDate);
  const result = await generateText({
    model: process.env.AI_GATEWAY_MODEL || DEFAULT_TRIP_MODEL,
    output: Output.object({ schema: itinerarySchema }),
    maxOutputTokens: 5000,
    maxRetries: 0,
    timeout: 50_000,
    abortSignal: signal,
    system: ITINERARY_INSTRUCTIONS,
    prompt: buildItineraryPrompt(input, summit, dates),
  });

  // Shape validation alone does not ensure the itinerary covers the requested window.
  const plan = tripPlanSchema.parse({ itinerary: result.output, dates });

  // Record only operational metadata, never travel preferences or generated content.
  console.info("Trip itinerary generated", {
    model: result.finalStep.response.modelId,
    inputTokens: result.totalUsage.inputTokens,
    outputTokens: result.totalUsage.outputTokens,
  });

  return plan;
}
