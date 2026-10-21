import "server-only";

const MAX_REQUESTS_PER_HOUR = 20;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;

// Best-effort protection for the MVP; instances do not share this counter.
// Replace this module with a shared limiter before a public rollout.
const requests = new Map<string, { count: number; expires: number }>();

export function allowTripGeneration(identity: string): boolean {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (entry.expires <= now) requests.delete(key);
  }

  const entry = requests.get(identity) || {
    count: 0,
    expires: now + REQUEST_WINDOW_MS,
  };
  if (entry.count >= MAX_REQUESTS_PER_HOUR) return false;

  requests.set(identity, { ...entry, count: entry.count + 1 });
  return true;
}
