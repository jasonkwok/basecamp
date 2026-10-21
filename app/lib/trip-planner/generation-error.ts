import "server-only";
import { APICallError } from "ai";
import { TripRequestError } from "./request";

function providerStatus(error: unknown): number | undefined {
  if (APICallError.isInstance(error)) return error.statusCode;

  if (error && typeof error === "object" && "statusCode" in error) {
    if (typeof error.statusCode === "number") return error.statusCode;
  }
}

// Keep provider response bodies, credentials, and prompts out of API errors.
export function describeGenerationError(error: unknown) {
  if (error instanceof TripRequestError) {
    return { message: error.message, status: error.status };
  }

  const status = providerStatus(error);

  if (status === 401) {
    return {
      message:
        "AI planning could not authenticate. Refresh the local Vercel environment or check Gateway credentials.",
      status: 503,
    };
  }

  if (status === 402 || status === 403) {
    return {
      message:
        "AI planning is unavailable. Check the Vercel AI Gateway credits, budget, and account setup.",
      status: 503,
    };
  }

  if (status === 429) {
    return {
      message: "AI planning is busy. Wait a moment and try again.",
      status: 429,
    };
  }

  return {
    message:
      "We couldn’t finish your itinerary. Your details are still here—please try again.",
    status: 503,
  };
}
