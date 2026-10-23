import type { MountainCatalogEntry } from "../../data/mountains";
import type { RouteTime } from "../../data/route-times";
import type { TripInput, TripPlan } from "./schema";

// Deliberately generic fixtures exercise the UI, not real route planning.
const MOCK_ENVIRONMENT = {
  altitude: "Not included in mock data.",
  temperature: "No temperature estimate in mock mode.",
  conditions: "Confirm route and weather conditions with a local source.",
};

export function createMockItinerary(
  input: TripInput,
  summit: MountainCatalogEntry,
  dates: string[],
  dayCount: number,
  routeTimes: RouteTime[] = [],
): TripPlan {
  const needsLongerPlan =
    input.objective === "summit" && dayCount < summit.tripLength.minDays;
  const usePhases =
    dayCount > 21 ||
    (input.objective === "summit" && summit.tripLength.minDays > 14);
  const summitOuting = routeTimes.find(
    (timing) => timing.scope === "summit outing",
  );

  return {
    dates,
    itinerary: {
      status: needsLongerPlan ? "needs-changes" : "draft",
      summary: needsLongerPlan
        ? `Mock preview: ${summit.name} needs more time than the selected trip allows. Extend the trip or revise the objective.`
        : `Mock preview for ${summit.name}. These placeholder days test the interface; they are not travel recommendations.`,
      timingNote:
        "Mock timing only. No seasons, conditions, access, or transport have been checked.",
      budgetNote:
        "Mock preview: use the Field Notes route allowance as a starting point. No current prices or travel costs were researched.",
      warnings: [
        {
          severity: "caution",
          title: "Local mock preview — no AI call",
          message:
            "This response is test data. Do not use these placeholder days to plan or attempt an ascent.",
        },
      ],
      equipment: {
        mustHave: [],
        importantToHave: [],
        niceToHave: [],
      },
      phases:
        !needsLongerPlan && usePhases
          ? createMockPhases(dayCount, input.objective, summit.id, summitOuting)
          : [],
      days:
        needsLongerPlan || usePhases
          ? []
          : Array.from({ length: dayCount }, (_, index) => ({
              title: `Preview day ${index + 1}`,
              activities: [
                "Placeholder activity for testing the itinerary layout.",
              ],
              overnight: "Placeholder accommodation — not researched",
              requiredEquipment: [],
              routeDetails: { difficulty: "Mock terrain — not route guidance.", altitudeChanges: [] },
              environment: MOCK_ENVIRONMENT,
              effort: [
                {
                  label: "Movement timing to confirm",
                  activity: "hiking",
                  timingId: null,
                  estimatedHours: "3-4",
                },
              ],
            })),
      assumptions: [
        "Local test fixture; no model tokens, live research, or bookings used.",
      ],
    },
  };
}

// Representative stage names test expedition layouts; durations are fixture data.
function createMockPhases(
  dayCount: number,
  objective: TripInput["objective"],
  mountainId: string,
  summitOuting?: RouteTime,
): TripPlan["itinerary"]["phases"] {
  const titles =
    objective === "summit"
      ? [
          "Approach and preparation",
          "Acclimatization rotations",
          "Recovery and summit-window reserve",
          "Conditional summit attempt",
          "Descent and return",
        ]
      : [
          "Outbound travel",
          "Visit or trek — first stage",
          "Rest and contingency",
          "Visit or trek — second stage",
          "Return travel",
        ];
  let startDay = 1;
  return titles.map((title, index) => {
    const endDay =
      index === titles.length - 1
        ? dayCount
        : Math.floor(dayCount * [0.2, 0.55, 0.75, 0.9][index]);
    const phase = {
      title,
      startDay,
      endDay,
      activities: [
        "Mock stage description — confirm the real plan with your operator.",
      ],
      overnight: "Accommodation or camp type to confirm",
      requiredEquipment: [],
      routeDetails: { difficulty: "Mock terrain — not route guidance.", altitudeChanges: [] },
      environment: MOCK_ENVIRONMENT,
      effort:
        mountainId === "everest" && objective === "summit" && index === 3
          ? [
              {
                label: "Camp 4 → summit",
                activity: "mountaineering" as const,
                timingId: "everest-c4-summit",
                estimatedHours: null,
              },
              {
                label: "Summit → Camp 4",
                activity: "mountaineering" as const,
                timingId: "everest-summit-c4",
                estimatedHours: null,
              },
            ]
          : summitOuting && objective === "summit" && index === 3
            ? [
                {
                  label: summitOuting.label,
                  activity: summitOuting.activity,
                  timingId: summitOuting.id,
                  estimatedHours: null,
                },
              ]
          : [
              {
                label: title,
                activity: (index === 2 ? "rest" : "hiking") as
                  "rest" | "hiking",
                timingId: null,
                estimatedHours: index === 2 ? null : ("6-7" as const),
              },
            ],
      decisionNote:
        "Provisional allocation only. Progress depends on guide assessment, recovery, access, and conditions.",
    };
    startDay = endDay + 1;
    return phase;
  });
}
