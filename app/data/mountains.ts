import catalog from "./mountains.json";
import { MOUNTAIN_TAGS, type MountainTagId } from "./mountain-tags";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "./difficulty-levels";

export type Summit = {
  kind: "mountain" | "destination";
  tripLength: {
    minDays: number;
    maxDays: number;
    basis: string;
    context: string;
    sourceUrl: string;
  };
  id: string;
  name: string;
  region: string;
  location: string;
  elevationMeters: number;
  description: string;
  coordinates: [longitude: number, latitude: number];
  sources: { label: string; url: string }[];
  reviewedAt: string;
  tags: MountainTagId[];
  difficulty: {
    level: DifficultyLevel;
    ascent: string;
    rationale: string;
    sourceUrl: string;
    ratingType: string;
  };
};

// Fail early on malformed catalog records so every consumer receives validated data.
function loadMountains(): Summit[] {
  if (catalog.schemaVersion !== 1)
    throw new Error("Unsupported mountain catalog version");

  const ids = new Set<string>();

  return catalog.mountains.map((entry) => {
    if (!entry.id || ids.has(entry.id))
      throw new Error(`Missing or duplicate mountain ID: ${entry.id}`);

    ids.add(entry.id);

    for (const value of [
      entry.name,
      entry.region,
      entry.location,
      entry.description,
      entry.reviewedAt,
    ]) {
      if (!value.trim())
        throw new Error(`Incomplete mountain record: ${entry.id}`);
    }

    if (entry.kind !== "mountain" && entry.kind !== "destination")
      throw new Error(`Invalid landmark kind: ${entry.id}`);

    // Trip estimates describe an editorial itinerary, not a universal ascent duration.
    const trip = entry.tripLength;

    if (
      !Number.isInteger(trip.minDays) ||
      trip.minDays < 1 ||
      !Number.isInteger(trip.maxDays) ||
      trip.maxDays < trip.minDays ||
      !trip.context.trim() ||
      trip.basis !== "editorial" ||
      new URL(trip.sourceUrl).protocol !== "https:"
    )
      throw new Error(`Invalid trip estimate: ${entry.id}`);

    const { longitude, latitude } = entry.coordinates;

    if (
      !Number.isFinite(longitude) ||
      Math.abs(longitude) > 180 ||
      !Number.isFinite(latitude) ||
      Math.abs(latitude) > 90
    ) {
      throw new Error(`Invalid mountain coordinates: ${entry.id}`);
    }

    if (!Number.isFinite(entry.elevationMeters) || entry.elevationMeters <= 0)
      throw new Error(`Invalid elevation: ${entry.id}`);

    if (
      !entry.sources.length ||
      entry.sources.some(
        (source) =>
          !source.label.trim() || new URL(source.url).protocol !== "https:",
      )
    ) {
      throw new Error(`Missing or invalid source: ${entry.id}`);
    }

    const tags = entry.tags.map((tag) => {
      if (!Object.hasOwn(MOUNTAIN_TAGS, tag))
        throw new Error(`Unknown mountain tag: ${tag}`);

      return tag as MountainTagId;
    });

    if (tags.includes("eight-thousander") && entry.elevationMeters <= 8000)
      throw new Error(`Invalid eight-thousander badge: ${entry.id}`);

    // Difficulty is meaningful only with a named ascent, explanation, and source.
    if (
      !Object.hasOwn(DIFFICULTY_LEVELS, entry.difficulty.level) ||
      !entry.difficulty.ascent.trim() ||
      !entry.difficulty.rationale.trim() ||
      new URL(entry.difficulty.sourceUrl).protocol !== "https:"
    ) {
      throw new Error(`Invalid ascent difficulty: ${entry.id}`);
    }

    return {
      ...entry,
      kind: entry.kind,
      tags,
      difficulty: {
        ...entry.difficulty,
        level: entry.difficulty.level as DifficultyLevel,
      },
      coordinates: [longitude, latitude],
    };
  });
}

// The JSON is the source of truth; this adapter validates it and converts the
// explicit latitude/longitude fields to Mapbox's longitude-first tuple.
export const MOUNTAINS = loadMountains();
