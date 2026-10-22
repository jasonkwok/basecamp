const REQUESTS_PER_HOUR = 50;
const ONE_HOUR_MS = 60 * 60 * 1000;

type RequestBucket = { count: number; expiresAt: number };

// Best-effort per-instance limits; use shared storage before a public rollout.
const requestBuckets = new Map<string, RequestBucket>();

export function allowAiRequest(identity: string, feature: string): boolean {
  const now = Date.now();

  for (const [key, bucket] of requestBuckets) {
    if (bucket.expiresAt <= now) requestBuckets.delete(key);
  }

  const bucketKey = `${feature}:${identity}`;
  const bucket = requestBuckets.get(bucketKey) ?? {
    count: 0,
    expiresAt: now + ONE_HOUR_MS,
  };

  if (bucket.count >= REQUESTS_PER_HOUR) return false;

  requestBuckets.set(bucketKey, { ...bucket, count: bucket.count + 1 });

  return true;
}
