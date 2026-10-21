import "server-only";

const MAX_REQUEST_BYTES = 8192;

export class TripRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// Bound actual bytes, not just Content-Length, which can be absent or inaccurate.
export async function readTripRequest(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader)
    throw new TripRequestError("Enter your trip details first.", 400);

  const decoder = new TextDecoder();
  let body = "";
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new TripRequestError("Trip details are too long.", 413);
    }

    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();

  try {
    return JSON.parse(body);
  } catch {
    throw new TripRequestError(
      "The trip details could not be read. Please try again.",
      400,
    );
  }
}
