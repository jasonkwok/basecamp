import type { MountainCatalogEntry } from "../../data/mountains";
import type { DifficultyLevel } from "../../data/difficulty-levels";
import { assessTripSuitability } from "../trip-planner/trip-suitability.ts";
import type { MountainExperience, MountainRecommendation, MountainGuidePreferences } from "./schema";

export type GuideOutput = {
  intent: "discovery" | "recommendations" | "answer";
  unmatchedPreferences: MountainGuidePreferences["firmRequirements"];
  preferences: MountainGuidePreferences;
  reply: string;
  recommendations: MountainRecommendation[];
};

const MAX_RECOMMENDATIONS = 5;
const MATCH_RANK = { low: 0, medium: 1, strong: 2, "very strong": 3 };
const DIFFICULTY_RANK: Record<DifficultyLevel, number> = {
  beginner: 0,
  intermediate: 1,
  difficult: 2,
  expert: 3,
  extreme: 4,
};
const EXPERIENCE_DIFFICULTY_CEILING: Record<MountainExperience, number> = {
  beginner: 1,
  regular: 1,
  "multi-day": 2,
  "high-altitude": 2,
  "high-altitude-summits": 2,
  technical: 3,
  expert: 4,
};

// Filter model matches without replacing discovery questions or padding the list.
export function applyRecommendationSafety(
  output: GuideOutput,
  experience: MountainExperience,
  mountains: Pick<MountainCatalogEntry, "id" | "name" | "location" | "region" | "difficulty" | "elevationMeters" | "tripLength">[],
  latestUserMessage = "",
  previouslyRecommendedMountainIds: string[] = [],
  summitedMountainIds: string[] = [],
): GuideOutput {
  const mountainById = new Map(mountains.map((mountain) => [mountain.id, mountain]));
  const previouslyRecommended = new Set(previouslyRecommendedMountainIds);
  const summited = new Set(summitedMountainIds);
  const hasCompletedOptions = output.recommendations.some(({ mountainId }) => summited.has(mountainId));
  const { preferences } = output;
  const firm = new Set(preferences.firmRequirements.filter(
    (key) => !preferences.relaxedPreferences.includes(key),
  ));
  const shouldExcludePreviousRecommendations = requestsMoreOptions(latestUserMessage);
  const rejected = new Set<string>();
  const tradeoffs = new Map<string, string[]>();
  const unsuitableRecommendations = output.recommendations.filter((recommendation) => {
    const mountain = mountainById.get(recommendation.mountainId);
    if (!mountain) { rejected.add("catalog coverage"); return true; }
    if (!isSuitableRecommendation(recommendation, experience, mountain)) {
      rejected.add("experience");
      return true;
    }
    const misses: string[] = [];
    if (preferences.locations.length > 0 &&
      !preferences.locations.some((location) => matchesRequestedLocation(mountain, location))) {
      misses.push("location");
    }
    // The catalog's altitude and trip length describe the named summit ascent.
    if (recommendation.objective === "summit") {
      if ((preferences.minAltitudeMeters !== null && mountain.elevationMeters < preferences.minAltitudeMeters) ||
        (preferences.maxAltitudeMeters !== null && mountain.elevationMeters > preferences.maxAltitudeMeters)) {
        misses.push("altitude");
      }
      if (preferences.maxTripDays !== null &&
        mountain.tripLength.minDays > preferences.maxTripDays) {
        misses.push("duration");
      }
    }
    const blocked = misses.filter((key) => firm.has(key as "location" | "altitude" | "duration"));
    if (blocked.length > 0) {
      blocked.forEach((key) => rejected.add(key));
      return true;
    }
    tradeoffs.set(recommendation.mountainId, misses);
    return false;
  });

  const seenMountainIds = new Set<string>();
  const recommendations = output.recommendations.filter((recommendation) => {
    if (unsuitableRecommendations.includes(recommendation)) return false;

    const { mountainId } = recommendation;
    if (summited.has(mountainId)) return false;

    if (
      shouldExcludePreviousRecommendations &&
      previouslyRecommended.has(mountainId)
    ) {
      return false;
    }

    if (seenMountainIds.has(mountainId)) return false;

    seenMountainIds.add(mountainId);

    return true;
  });

  const rated = recommendations.map((recommendation) => {
    const misses = tradeoffs.get(recommendation.mountainId) ?? [];
    if (misses.length === 0) return recommendation;
    const ceiling = misses.length > 1 ? "low" : "medium";
    const rating = MATCH_RANK[recommendation.rating] > MATCH_RANK[ceiling]
      ? ceiling : recommendation.rating;
    const reason = `Outside your preferred ${misses.join(" and ")}. ${recommendation.reason}`.slice(0, 300);
    return { ...recommendation, rating, reason };
  });
  const ranked = rated.toSorted((left, right) =>
    MATCH_RANK[right.rating] - MATCH_RANK[left.rating],
  ).slice(0, MAX_RECOMMENDATIONS);

  if (unsuitableRecommendations.length > 0 && ranked.length === 0) {
    const adjustable = [...rejected].filter((key) => key !== "experience" && key !== "catalog coverage");
    return {
      ...output,
      reply: adjustable.length > 0
        ? `These options miss your firm ${adjustable.join(" and ")} requirements. Which would you be open to relaxing?`
        : rejected.has("experience")
          ? "These objectives exceed your selected experience. A less demanding climb or guided training may be a better next step."
          : "These options aren’t in the catalog. I can only match destinations covered here.",
      recommendations: [],
    };
  }

  if (output.recommendations.length > 0 && ranked.length === 0) {
    return {
      ...output,
      reply: hasCompletedOptions
        ? "These mountains are already marked as summited. I’ll look for a different next objective."
        : "There are no new matches in this set; the remaining options have already been shown.",
      recommendations: [],
    };
  }

  return {
    ...output,
    reply: unsuitableRecommendations.length > 0 || hasCompletedOptions
      ? "These are the remaining matches for your current preferences."
      : output.reply,
    recommendations: ranked,
  };
}

function requestsMoreOptions(message: string) {
  return /\b(?:more|new|different|additional|other)\s+(?:options?|mountains?|recommendations?|suggestions?)\b|\b(?:show me more|another set|alternatives)\b/i.test(
    message,
  );
}

function isSuitableRecommendation(
  recommendation: MountainRecommendation,
  experience: MountainExperience,
  mountain: Pick<MountainCatalogEntry, "id" | "name" | "difficulty">,
) {
  if (
    assessTripSuitability(
      { experience, objective: recommendation.objective },
      mountain,
    ) !== null
  ) {
    return false;
  }

  return (
    recommendation.objective !== "summit" ||
    DIFFICULTY_RANK[mountain.difficulty.level] <=
      EXPERIENCE_DIFFICULTY_CEILING[experience]
  );
}

export function matchesRequestedLocation(
  mountain: Pick<MountainCatalogEntry, "location" | "region">,
  requestedLocation: string,
) {
  const locationText = `${mountain.location} ${mountain.region}`.toLowerCase();
  const requested = requestedLocation.toLowerCase();
  const aliases: Record<string, string[]> = {
    "united states": ["united states", "usa", "us"],
    "united kingdom": ["united kingdom", "uk", "britain"],
  };

  return (aliases[requested] ?? [requested]).some((alias) => {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escapedAlias}\\b`, "i").test(locationText);
  });
}
