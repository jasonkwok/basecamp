import catalog from "./mountains.json";
import { MOUNTAIN_TAGS, type MountainTagId } from "./mountain-tags";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "./difficulty-levels";

type MountainCatalogFields = {
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
  coordinates: MountainCoordinates;
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

export type MountainCoordinates = [longitude: number, latitude: number];

// The catalog includes both climbing objectives and non-climbing destinations.
export type Mountain = MountainCatalogFields & { kind: "mountain" };
export type Destination = MountainCatalogFields & { kind: "destination" };
export type MountainCatalogEntry = Mountain | Destination;

// Fail early on malformed catalog records so every consumer receives validated data.
function loadMountains(): MountainCatalogEntry[] {
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

    const kind = entry.kind;
    if (kind !== "mountain" && kind !== "destination")
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

    const coordinates: MountainCoordinates = [longitude, latitude];

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
      if (!isMountainTagId(tag))
        throw new Error(`Unknown mountain tag: ${tag}`);

      return tag;
    });

    if (tags.includes("eight-thousander") && entry.elevationMeters <= 8000)
      throw new Error(`Invalid eight-thousander badge: ${entry.id}`);

    // Difficulty is meaningful only with a named ascent, explanation, and source.
    const difficultyLevel = entry.difficulty.level;
    if (
      !isDifficultyLevel(difficultyLevel) ||
      !entry.difficulty.ascent.trim() ||
      !entry.difficulty.rationale.trim() ||
      new URL(entry.difficulty.sourceUrl).protocol !== "https:"
    ) {
      throw new Error(`Invalid ascent difficulty: ${entry.id}`);
    }

    return {
      ...entry,
      kind,
      tags,
      difficulty: {
        ...entry.difficulty,
        level: difficultyLevel,
      },
      coordinates,
    };
  });
}

function isMountainTagId(value: string): value is MountainTagId {
  return Object.hasOwn(MOUNTAIN_TAGS, value);
}

function isDifficultyLevel(value: string): value is DifficultyLevel {
  return Object.hasOwn(DIFFICULTY_LEVELS, value);
}

// The JSON is the source of truth; this adapter validates it and converts the
// explicit latitude/longitude fields to Mapbox's longitude-first tuple.
export const MOUNTAINS = loadMountains();
