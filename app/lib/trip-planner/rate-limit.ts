import { allowAiRequest } from "../ai/rate-limit";

export function allowTripGeneration(identity: string): boolean {
  return allowAiRequest(identity, "trip-plan");
}
