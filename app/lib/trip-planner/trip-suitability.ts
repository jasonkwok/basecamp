import type { MountainCatalogEntry } from "../../data/mountains";
import type { TripInput, TripPlan } from "./schema";

type ExperienceAndGoal = Pick<TripInput, "objective" | "experience">;
type MountainContext = Pick<MountainCatalogEntry, "name" | "difficulty">;
export type TripWarning = TripPlan["itinerary"]["warnings"][number];

// These are conservative planning rules, not a certification that other trips are suitable.
// Everest prerequisites: https://www.alpineascents.com/climbs/mount-everest/#prerequisites
export function assessTripSuitability(
  input: ExperienceAndGoal,
  summit: MountainContext,
): TripWarning | null {
  // The catalog rating describes its named ascent, not sightseeing or a base-camp trek.
  if (input.objective !== "summit") return null;

  const isTechnicalClimber =
    input.experience === "technical" || input.experience === "expert";
  const isExtremeAscent = summit.difficulty.level === "extreme";
  const lacksTechnicalExperience =
    summit.difficulty.level === "expert" && !isTechnicalClimber;
  const lacksExpeditionExperience =
    isExtremeAscent && input.experience !== "expert";

  if (!lacksTechnicalExperience && !lacksExpeditionExperience) return null;

  const advice =
    input.experience === "beginner"
      ? `As a beginner, you should not attempt to summit ${summit.name}.`
      : `Based on your selected experience, we strongly advise against attempting the summit of ${summit.name}.`;

  return {
    severity: "critical",
    title: `Do not attempt this summit with your current experience`,
    message: `${advice} The named ascent is ${summit.difficulty.ascent}: ${summit.difficulty.rationale} Build the relevant mountaineering experience and have a qualified guide or expedition operator assess your readiness. Choose a different objective or a more suitable mountain to continue planning.`,
  };
}

// Return a complete, displayable response without asking a model to plan the ascent.
export function createUnsuitableTripPlan(
  warning: TripWarning,
  dates: string[],
): TripPlan {
  return {
    dates,
    itinerary: {
      status: "needs-changes",
      summary:
        "This summit objective does not match your selected experience. We strongly advise against proceeding with this ascent.",
      timingNote:
        "Revise the objective before choosing an ascent schedule. Extra days alone do not replace the required experience.",
      budgetNote:
        "A larger budget or additional equipment does not resolve this experience mismatch.",
      warnings: [warning],
      equipment: { mustHave: [], importantToHave: [], niceToHave: [] },
      days: [],
      phases: [],
      assumptions: [
        "This assessment uses your self-reported experience and the catalog’s named ascent. Other objectives require their own assessment.",
      ],
    },
  };
}
