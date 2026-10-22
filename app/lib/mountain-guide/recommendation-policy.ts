import type { Summit } from "../../data/mountains";
import type { DifficultyLevel } from "../../data/difficulty-levels";
import { assessTripSuitability } from "../trip-planner/trip-suitability.ts";
import type { MountainExperience, MountainRecommendation } from "./schema";

type GuideOutput = {
  reply: string;
  recommendations: MountainRecommendation[];
};

const MAX_RECOMMENDATIONS = 3;
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

// Enforce summit difficulty limits and keep a clear goal from looping on follow-up questions.
export function applyRecommendationSafety(
  output: GuideOutput,
  experience: MountainExperience,
  mountains: Pick<Summit, "id" | "name" | "location" | "region" | "difficulty">[],
  travelerContext = "",
  summitedMountainIds: string[] = [],
  latestUserMessage = "",
  previouslyRecommendedMountainIds: string[] = [],
  previousRecommendations: MountainRecommendation[] = [],
): GuideOutput {
  const mountainById = new Map(mountains.map((mountain) => [mountain.id, mountain]));
  const asksForMoreOptions = requestsMoreOptions(latestUserMessage);
  const previouslyRecommended = new Set(previouslyRecommendedMountainIds);
  const latestRequestedLocation = findRequestedLocation(latestUserMessage, mountains);
  const requestedLocation =
    latestRequestedLocation ?? findRequestedLocation(travelerContext, mountains);
  const shouldExcludePreviousRecommendations =
    asksForMoreOptions || latestRequestedLocation !== null;

  const unsafeRecommendations = output.recommendations.filter((recommendation) => {
    const mountain = mountainById.get(recommendation.mountainId);

    return mountain !== undefined &&
      !isSuitableRecommendation(recommendation, experience, mountain);
  });
  const unsuitableRecommendations = output.recommendations.filter((recommendation) => {
    const mountain = mountainById.get(recommendation.mountainId);

    return (
      mountain === undefined ||
      !isSuitableRecommendation(recommendation, experience, mountain) ||
      (requestedLocation !== null &&
        !matchesRequestedLocation(mountain, requestedLocation))
    );
  });

  const seenMountainIds = new Set<string>();
  const recommendations = output.recommendations.filter((recommendation) => {
    if (unsuitableRecommendations.includes(recommendation)) return false;

    const { mountainId } = recommendation;

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

  // A clear summit goal plus a selected experience level is enough to offer a first set.
  if (requestsSummit(travelerContext)) {
    const progressionRecommendations = fillCatalogRecommendations(
      recommendations,
      experience,
      mountains,
      summitedMountainIds,
      shouldExcludePreviousRecommendations ? previouslyRecommendedMountainIds : [],
      requestedLocation,
    );

    if (progressionRecommendations.length === 0) {
      return {
        reply: unsafeRecommendations.length > 0
          ? requestedLocation !== null
            ? `I can’t find a summit in ${requestedLocation} that fits your selected experience. I strongly advise against attempting a route beyond your current level; try a trek or broaden the search to another region.`
            : "I can’t find a suitable summit for your selected experience in the current options. I strongly advise against attempting a route beyond your current level; consider guided training or a less demanding objective."
          : requestedLocation !== null
            ? `I don’t have any unshown summit options in ${requestedLocation} that fit your experience. Would you like to consider a trek or another region?`
            : "I’ve run out of unshown summit options that fit your experience. Would you like to consider a trek or broaden the search?",
        recommendations: [],
      };
    }

    return {
      reply: asksForMoreOptions && requestedLocation !== null
        ? `Here are fresh summit options in ${requestedLocation} that fit your experience. Which one sounds like the best fit?`
        : asksForMoreOptions
        ? "Here are three fresh summit options that fit your selected experience. Which one sounds like the best fit?"
        : requestedLocation !== null && unsuitableRecommendations.length > 0
        ? unsafeRecommendations.length > 0
          ? `The summit you asked about exceeds your selected experience, so don’t attempt it yet. These options stay within ${requestedLocation} and fit your current level. Ask a qualified guide to assess readiness before taking on a harder objective.`
          : `I’ve kept these recommendations within ${requestedLocation} and matched them to your selected experience. If you want a different challenge, tell me your preferred route type or trip length.`
        : unsuitableRecommendations.length > 0
        ? "The requested summit exceeds the experience you’ve shared, so don’t attempt it yet. These are progressive objectives matched to your current level; build skills through guided training, then ask a qualified guide to assess readiness for a harder goal."
        : "With your selected experience and summit goal, these are three suitable starting points. They offer a progressive challenge; share your available time or preferred region if you’d like me to narrow the list.",
      recommendations: progressionRecommendations,
    };
  }

  if (shouldExcludePreviousRecommendations) {
    if (!asksForMoreOptions && output.recommendations.length === 0) {
      return { ...output, recommendations };
    }

    const objective =
      output.recommendations[0]?.objective ??
      previousRecommendations.at(-1)?.objective ??
      "summit";
    const freshRecommendations = fillCatalogRecommendations(
      recommendations,
      experience,
      mountains,
      summitedMountainIds,
      shouldExcludePreviousRecommendations ? previouslyRecommendedMountainIds : [],
      requestedLocation,
      objective,
    );

    return {
      reply: freshRecommendations.length > 0
        ? requestedLocation !== null
          ? `Here are a few options in ${requestedLocation} that fit your experience. Which one sounds closest to the kind of trip you want?`
          : "Here are three fresh options that fit your experience and the objective you asked for. Which one sounds most interesting?"
        : requestedLocation !== null
          ? `I don’t have any unshown options in ${requestedLocation} that fit your current profile. Would you like to broaden the location or consider a different objective?`
          : "I’ve shown all catalog options that fit your experience and location. You can broaden the list by changing your experience level, location, or objective.",
      recommendations: freshRecommendations,
    };
  }

  if (unsuitableRecommendations.length === 0) {
    return { ...output, recommendations };
  }

  const progressionRecommendations = fillCatalogRecommendations(
    recommendations,
    experience,
    mountains,
    summitedMountainIds,
    shouldExcludePreviousRecommendations ? previouslyRecommendedMountainIds : [],
    requestedLocation,
    recommendations[0]?.objective ?? "summit",
  );
  return {
    reply:
      "The requested summit exceeds the experience you’ve shared, so don’t attempt it yet. These are progressive objectives matched to your current level; build skills through guided training, then ask a qualified guide to assess readiness for a harder goal.",
    recommendations: progressionRecommendations,
  };
}

function requestsMoreOptions(message: string) {
  return /\b(?:more|new|different|additional|other)\s+(?:options?|mountains?|recommendations?|suggestions?)\b|\b(?:show me more|another set|alternatives)\b/i.test(
    message,
  );
}

function findRequestedLocation(
  travelerContext: string,
  mountains: Pick<Summit, "location" | "region">[],
) {
  const locations = new Set(
    mountains.flatMap(({ location }) =>
      location.split(/[·,/]/).map((part) => part.trim()).filter(Boolean),
    ).concat(mountains.map(({ region }) => region)),
  );
  const context = travelerContext.toLowerCase();

  return (
    [...locations]
      .filter((location) => {
        const normalizedLocation = location.toLowerCase();
        const escapedLocation = normalizedLocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const locationMention = new RegExp(`\\b${escapedLocation}\\b`, "i");
        const geographicIntent = new RegExp(
          `\\b(?:in|near|around|within)\\s+(?:the\\s+)?${escapedLocation}\\b`,
          "i",
        );

        return locationMention.test(context) && geographicIntent.test(context);
      })
      .sort((left, right) => right.length - left.length)[0] ?? null
  );
}

function isSuitableRecommendation(
  recommendation: MountainRecommendation,
  experience: MountainExperience,
  mountain: Pick<Summit, "id" | "name" | "difficulty">,
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

function matchesRequestedLocation(
  mountain: Pick<Summit, "location" | "region">,
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

function requestsSummit(message: string) {
  const userTurns = message.split("\n").filter(Boolean).reverse();

  for (const turn of userTurns) {
    if (
      /\b(?:i don't want to|i do not want to|not looking to|not interested in|rather not)\s+(?:summit|summiting|climb|climbing|peaks?)\b/i.test(
        turn,
      )
    ) {
      return false;
    }

    if (/\b(summit|summiting|peak)\b/i.test(turn)) return true;

    if (/\b(?:want|hope|plan|aim|intend|looking)\b.{0,25}\bclimb\b/i.test(turn)) {
      return true;
    }

    if (/\b(?:trek|hike|visit)\b/i.test(turn)) return false;
  }

  return false;
}

// Replace blocked summit suggestions with catalog climbs suited to the current level.
function fillCatalogRecommendations(
  current: MountainRecommendation[],
  experience: MountainExperience,
  mountains: Pick<Summit, "id" | "name" | "location" | "region" | "difficulty">[],
  summitedMountainIds: string[] = [],
  excludedMountainIds: string[] = [],
  requestedLocation: string | null = null,
  objective: MountainRecommendation["objective"] = "summit",
): MountainRecommendation[] {
  const recommendations = [...current];
  const alreadyRecommended = new Set([
    ...current.map(({ mountainId }) => mountainId),
    ...summitedMountainIds,
    ...excludedMountainIds,
  ]);
  const difficultyCeiling = EXPERIENCE_DIFFICULTY_CEILING[experience];
  const availableMountains = mountains.filter((mountain) => {
    return (
      !alreadyRecommended.has(mountain.id) &&
      (requestedLocation === null ||
        matchesRequestedLocation(mountain, requestedLocation)) &&
      (objective !== "summit" ||
        DIFFICULTY_RANK[mountain.difficulty.level] <= difficultyCeiling) &&
      assessTripSuitability({ experience, objective }, mountain) === null
    );
  });
  const candidates =
    objective === "summit"
      ? availableMountains.toSorted(
          (left, right) =>
            DIFFICULTY_RANK[right.difficulty.level] -
            DIFFICULTY_RANK[left.difficulty.level],
        )
      : availableMountains;

  for (const mountain of candidates) {
    if (recommendations.length >= MAX_RECOMMENDATIONS) break;

    alreadyRecommended.add(mountain.id);
    recommendations.push({
      mountainId: mountain.id,
      objective,
      reason: buildFallbackReason(mountain, objective),
    });
  }

  return recommendations;
}

function buildFallbackReason(
  mountain: Pick<Summit, "difficulty">,
  objective: MountainRecommendation["objective"],
) {
  if (objective === "summit") {
    return `A ${mountain.difficulty.level}-rated ascent to build experience progressively. Follow the route’s seasonal guidance and get qualified advice on readiness.`;
  }

  if (objective === "trek") {
    return "A trekking alternative matched to your selected experience. Check seasonal route guidance before deciding.";
  }

  return "A visit-focused alternative matched to your selected experience. Check seasonal access guidance before deciding.";
}
