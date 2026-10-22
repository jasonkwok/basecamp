import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
} from "ai";
import { MOUNTAINS } from "../../data/mountains";
import { allowAiRequest } from "../../lib/ai/rate-limit";
import { generateMountainRecommendations } from "../../lib/mountain-guide/generate-recommendations";
import {
  mountainGuideDataSchemas,
  mountainGuideExperienceSchema,
  type MountainGuideMessage,
} from "../../lib/mountain-guide/schema";

export const maxDuration = 30;

const MAX_REQUEST_BYTES = 24_000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARACTERS = 1_200;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function failure(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return failure("Open the mountain guide from Basecamp to continue.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return failure("Send your preferences as JSON.", 415);
  }

  try {
    const body = await readRequestBody(request);

    if (!isRecord(body)) return failure("The chat request is invalid.", 400);

    const experience = mountainGuideExperienceSchema.safeParse(body.experience);
    if (!experience.success) {
      return failure("Choose an experience level before getting a match.", 400);
    }

    if (!Array.isArray(body.messages) || body.messages.length > MAX_MESSAGES) {
      return failure("This chat is too long. Start a new conversation.", 400);
    }

    const summitedMountainIds = readSummitedMountainIds(body.summitedMountainIds);
    if (!summitedMountainIds) {
      return failure("The summit list could not be read.", 400);
    }

    const validation = await safeValidateUIMessages<MountainGuideMessage>({
      messages: body.messages,
      dataSchemas: mountainGuideDataSchemas,
    });

    if (!validation.success) {
      return failure("The chat history is invalid. Please start a new message.", 400);
    }

    const messages = validation.data;

    if (!hasValidConversation(messages)) {
      return failure("Send a message to get a mountain recommendation.", 400);
    }

    const latestMessage = messages.at(-1)!;
    if (latestMessage.role !== "user" || !hasBoundedText(messages)) {
      return failure("Keep each message under 1,200 characters.", 400);
    }

    const requesterId =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (!allowAiRequest(requesterId, "mountain-guide")) {
      return failure("You’ve reached the limit of 50 guide replies per hour.", 429);
    }

    const output = await generateMountainRecommendations({
      messages,
      experience: experience.data,
      summitedMountainIds,
      signal: request.signal,
    });

    // Stream the concise reply and its catalog-backed cards as one assistant turn.
    const stream = createUIMessageStream<MountainGuideMessage>({
      execute: ({ writer }) => {
        const textId = crypto.randomUUID();
        writer.write({ type: "start" });
        writer.write({ type: "text-start", id: textId });
        writer.write({ type: "text-delta", id: textId, delta: output.reply });
        writer.write({ type: "text-end", id: textId });
        if (output.recommendations.length > 0) {
          writer.write({
            type: "data-mountain-recommendations",
            data: output.recommendations,
          });
        }
        writer.write({ type: "finish", finishReason: "stop" });
      },
    });

    return createUIMessageStreamResponse({
      stream,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return failure(error.message, error.status);
    }

    const statusCode = getErrorStatusCode(error);
    console.error("Mountain guide request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      statusCode,
    });
    return failure(getGuideFailureMessage(error, statusCode), 503);
  }
}

function getErrorStatusCode(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return null;
}

function getGuideFailureMessage(error: unknown, statusCode: number | null) {
  if (statusCode === 401 || statusCode === 403) {
    return "AI Gateway authentication failed. Refresh your local Vercel credentials and try again.";
  }

  if (statusCode === 402) {
    return "AI Gateway could not access this model. Check your account credits and model access.";
  }

  if (statusCode === 429) {
    return "AI Gateway is temporarily rate limited. Please wait a moment and try again.";
  }

  if (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return "The guide took too long to respond. Please try again.";
  }

  return "The mountain guide couldn’t respond just now. Please try again.";
}

async function readRequestBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError("Send a chat message first.", 400);

  const decoder = new TextDecoder();
  let text = "";
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    byteLength += value.byteLength;
    if (byteLength > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RequestBodyError("This chat request is too large.", 413);
    }

    text += decoder.decode(value, { stream: true });
  }

  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    throw new RequestBodyError("The chat request could not be read.", 400);
  }
}

function readSummitedMountainIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MOUNTAINS.length) return null;

  const knownIds = new Set(MOUNTAINS.map(({ id }) => id));
  if (value.some((id) => typeof id !== "string" || !knownIds.has(id))) {
    return null;
  }

  return [...new Set(value)];
}

function hasValidConversation(messages: MountainGuideMessage[]): boolean {
  if (messages.length === 0) return false;

  return messages.every((message) => {
    if (message.role !== "user" && message.role !== "assistant") return false;

    const hasText = message.parts.some(
      (part) => part.type === "text" && part.text.trim().length > 0,
    );
    if (!hasText) return false;

    return message.parts.every((part) => {
      if (part.type === "text") return part.text.trim().length > 0;
      return (
        message.role === "assistant" &&
        part.type === "data-mountain-recommendations"
      );
    });
  });
}

function hasBoundedText(messages: MountainGuideMessage[]): boolean {
  return messages.every((message) =>
    message.parts.every(
      (part) => part.type !== "text" || part.text.length <= MAX_MESSAGE_CHARACTERS,
    ),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
