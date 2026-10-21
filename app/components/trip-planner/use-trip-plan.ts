import { useEffect, useRef, useState } from "react";
import {
  tripInputSchema,
  type TripInput,
  type TripPlan,
} from "../../lib/trip-planner/schema";
import { requestTripPlan } from "./trip-plan-client";

type GeneratedTrip = {
  plan: TripPlan;
  input: TripInput;
};

export function useTripPlan() {
  const activeRequest = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedTrip | null>(null);

  // Closing the planner cancels its in-flight generation.
  useEffect(() => {
    return () => {
      activeRequest.current?.abort();
    };
  }, []);

  async function generate(input: TripInput) {
    const parsed = tripInputSchema.safeParse(input);

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    activeRequest.current?.abort();
    const requestController = new AbortController();
    activeRequest.current = requestController;

    setPending(true);
    setError("");

    try {
      const plan = await requestTripPlan(parsed.data, requestController.signal);

      // Keep the last valid draft and its original inputs until a new one succeeds.
      if (!requestController.signal.aborted)
        setResult({ plan, input: parsed.data });
    } catch (error) {
      if (!requestController.signal.aborted) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      // A cancelled request must not change the status of its replacement.
      if (activeRequest.current === requestController) setPending(false);
    }
  }

  function cancel() {
    activeRequest.current?.abort();
    setPending(false);
  }

  return { pending, error, result, generate, cancel };
}
