import { tripPlanSchema, type TripInput } from "../../lib/trip-planner/schema";

// Keep HTTP details and response validation separate from React request state.
export async function requestTripPlan(input: TripInput, signal: AbortSignal) {
  const response = await fetch("/api/trip-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Itinerary generation failed. Please try again.",
    );
  }

  return tripPlanSchema.parse(data);
}
