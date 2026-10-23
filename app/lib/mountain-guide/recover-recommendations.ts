import type { MountainCatalogEntry } from "../../data/mountains";
import type { MountainExperience, MountainRecommendation, MountainGuidePreferences } from "./schema";
import { getLatestLocationPreference } from "./latest-preferences.ts";
import { applyRecommendationSafety, matchesRequestedLocation, type GuideOutput } from "./recommendation-policy.ts";

type RecoveryInput = {
  output: GuideOutput;
  experience: MountainExperience;
  mountains: MountainCatalogEntry[];
  latestUserMessage: string;
  previouslyRecommendedMountainIds: string[];
  summitedMountainIds: string[];
  regenerate: (candidates: MountainRecommendation[], preferences: MountainGuidePreferences) => Promise<GuideOutput>;
};

// One bounded rematch, using only climbs that pass the same checks as final cards.
export async function recoverMountainRecommendations({
  output,
  experience,
  mountains,
  latestUserMessage,
  previouslyRecommendedMountainIds,
  summitedMountainIds,
  regenerate,
}: RecoveryInput): Promise<GuideOutput> {
  const latestLocations = getLatestLocationPreference(latestUserMessage, mountains);
  const isLocationRefinement = latestLocations !== undefined;
  if (isLocationRefinement) {
    output = {
      ...output,
      preferences: {
        ...output.preferences,
        locations: latestLocations,
        firmRequirements: latestLocations.length === 0
          ? output.preferences.firmRequirements.filter((key) => key !== "location")
          : [...new Set([...output.preferences.firmRequirements, "location" as const])],
        relaxedPreferences: latestLocations.length === 0
          ? [...new Set([...output.preferences.relaxedPreferences, "location" as const])]
          : output.preferences.relaxedPreferences.filter((key) => key !== "location"),
      },
    };
  }
  const validate = (draft: GuideOutput) => applyRecommendationSafety(
    draft, experience, mountains, latestUserMessage, previouslyRecommendedMountainIds, summitedMountainIds,
  );
  const response = validate(output);
  // Preserve discovery and genuine no-match explanations, rather than forcing cards.
  if (response.recommendations.length > 0 ||
    (output.recommendations.length === 0 && output.intent !== "recommendations" &&
      !(isLocationRefinement && previouslyRecommendedMountainIds.length > 0))) {
    return response;
  }

  const excluded = new Set(summitedMountainIds);
  let candidates = mountains.flatMap((mountain): MountainRecommendation[] => {
    if (mountain.kind !== "mountain" || excluded.has(mountain.id)) return [];
    const candidate: MountainRecommendation = {
      mountainId: mountain.id,
      objective: "summit",
      rating: "medium",
      reason: `${mountain.difficulty.ascent}: a ${mountain.difficulty.level}-rated ascent at ${mountain.elevationMeters.toLocaleString("en-US")} m for building summit experience.`.slice(0, 300),
    };
    return validate({ ...output, recommendations: [candidate] }).recommendations.map(
      ({ rating }) => ({ ...candidate, rating }),
    );
  });

  let usesTrekAlternatives = false;
  const firm = output.preferences.firmRequirements.filter(
    (key) => !output.preferences.relaxedPreferences.includes(key),
  );
  // Named trekking destinations can offer an explicit alternative where the
  // catalog has no suitable summit. Never borrow a summit's altitude or duration
  // to claim that a trek meets a firm requirement we cannot verify.
  if (candidates.length === 0 && !firm.includes("altitude") && !firm.includes("duration")) {
    candidates = mountains.flatMap((mountain): MountainRecommendation[] => {
      if (mountain.kind !== "destination" || !mountain.tags.includes("trekking") || excluded.has(mountain.id)) return [];
      const candidate: MountainRecommendation = {
        mountainId: mountain.id, objective: "trek", rating: "medium",
        reason: `A trekking alternative via ${mountain.difficulty.ascent}, rather than a summit climb.`.slice(0, 300),
      };
      return validate({ ...output, recommendations: [candidate] }).recommendations.map(
        ({ rating }) => ({ ...candidate, rating }),
      );
    });
    usesTrekAlternatives = candidates.length > 0;
  }

  if (candidates.length === 0) {
    // Check actual catalog alternatives to name the remaining blocker, rather than
    // reporting only that the model's original selections were too difficult.
    const alternatives = mountains.filter((mountain) => mountain.kind === "mountain" && !excluded.has(mountain.id)).map(
      (mountain): MountainRecommendation => ({
        mountainId: mountain.id, objective: "summit", rating: "medium",
        reason: "A possible next climb to assess against your current preferences.",
      }),
    );
    if (alternatives.length === 0) {
      return { ...output, reply: "All remaining catalog climbs have already been completed or shown. A guided skills course may offer a useful next step beyond this catalog.", recommendations: [] };
    }
    const scopedAlternatives = output.preferences.locations.length > 0 &&
      output.preferences.firmRequirements.includes("location")
      ? alternatives.filter(({ mountainId }) => {
        const mountain = mountains.find(({ id }) => id === mountainId)!;
        return output.preferences.locations.some((location) => matchesRequestedLocation(mountain, location));
      })
      : alternatives;
    if (scopedAlternatives.length === 0) {
      return { ...output, reply: `The catalog has no remaining climbs in ${output.preferences.locations.join(" or ")}. Would a nearby area work?`, recommendations: [] };
    }
    const scoped = validate({ ...output, recommendations: scopedAlternatives });
    return {
      ...scoped,
      reply: scoped.recommendations.length === 0 && output.preferences.locations.length > 0
        ? `I searched ${output.preferences.locations.join(" or ")}, but the catalog’s climbs there don’t fit your selected experience or remaining requirements. Would a trek there work instead?`
        : scoped.reply,
    };
  }

  const fallback: GuideOutput = {
    ...output,
    intent: "recommendations",
    unmatchedPreferences: [],
    reply: usesTrekAlternatives
      ? "The catalog has no summit climbs that meet your current requirements. These named treks are alternatives, rather than summit recommendations."
      : isLocationRefinement && output.preferences.locations.length > 0
      ? `These climbs match your updated search in ${output.preferences.locations.join(" or ")}; the cards show any tradeoffs.`
      : "These less demanding climbs fit your selected experience; the cards show any tradeoffs with your preferences.",
    recommendations: candidates,
  };
  try {
    const replacement = await regenerate(candidates, output.preferences);
    const allowedOptions = new Set(candidates.map(({ mountainId, objective }) => `${mountainId}:${objective}`));
    const checked = validate({
      ...replacement,
      // Recovery cannot silently alter firm requirements or the traveler's profile.
      preferences: output.preferences,
      recommendations: replacement.recommendations.filter(
        ({ mountainId, objective }) => allowedOptions.has(`${mountainId}:${objective}`),
      ),
    });
    if (checked.recommendations.length > 0) return checked;
    // The catalog checks cannot establish skill instruction or personalized budget.
    // Respect a specific gap there, but not another generic difficulty warning.
    const unresolved = (replacement.unmatchedPreferences ?? []).filter(
      (key) => (key === "skills" && output.preferences.skills.length > 0) ||
        (key === "budget" && output.preferences.budget !== null),
    );
    if (replacement.recommendations.length === 0 && unresolved.length > 0) return checked;
  } catch {
    // A failed rematch should not hide catalog options already checked above.
  }
  return validate(fallback);
}
