export type RouteTime = {
  id: string;
  label: string;
  activity: "hiking" | "mountaineering" | "technical-climbing";
  minHours: number;
  maxHours: number;
  matchTerms?: string[];
  scope:
    | "one-way ascent"
    | "one-way descent"
    | "summit outing"
    | "round trip";
  sourceUrl: string;
};

// Operator estimates for Everest's South Col route, reviewed October 21, 2026.
// These are route references, not personal pace predictions or turnaround times.
const EVEREST_SOURCE = "https://altitudejunkies.com/everestroute.html";
const EVEREST_TIMES: RouteTime[] = [
  {
    id: "everest-bc-c1",
    label: "Base Camp → Camp 1",
    activity: "technical-climbing",
    minHours: 4,
    maxHours: 8,
    scope: "one-way ascent",
    sourceUrl: EVEREST_SOURCE,
  },
  {
    id: "everest-c1-c2",
    label: "Camp 1 → Camp 2",
    activity: "mountaineering",
    minHours: 2,
    maxHours: 4,
    scope: "one-way ascent",
    sourceUrl: EVEREST_SOURCE,
  },
  {
    id: "everest-c2-c3",
    label: "Camp 2 → Camp 3",
    activity: "technical-climbing",
    minHours: 3,
    maxHours: 6,
    scope: "one-way ascent",
    sourceUrl: EVEREST_SOURCE,
  },
  {
    id: "everest-c3-c4",
    label: "Camp 3 → Camp 4",
    activity: "technical-climbing",
    minHours: 6,
    maxHours: 10,
    scope: "one-way ascent",
    sourceUrl: EVEREST_SOURCE,
  },
  {
    id: "everest-c4-summit",
    label: "Camp 4 → summit",
    activity: "mountaineering",
    minHours: 8,
    maxHours: 12,
    scope: "one-way ascent",
    sourceUrl: EVEREST_SOURCE,
  },
  {
    id: "everest-summit-c4",
    label: "Summit → Camp 4",
    activity: "mountaineering",
    minHours: 3,
    maxHours: 4,
    scope: "one-way descent",
    sourceUrl: EVEREST_SOURCE,
  },
];

// Expeditions Unlimited's G2 outing includes the summit ascent and descent to C2.
const GASHERBRUM_II_TIMES: RouteTime[] = [
  {
    id: "gasherbrum-ii-summit-push",
    label: "Camp 3 → summit → Camp 2",
    activity: "mountaineering",
    minHours: 12,
    maxHours: 14,
    scope: "summit outing",
    sourceUrl:
      "https://www.expeditions-unlimited.com/en/expeditions/himalayas/climb-gasherbrum-ii-8034-meters-pakistan",
  },
];

// AltiPro's published North Face schedule describes a long summit descent.
const ANNAPURNA_I_SOURCE =
  "https://www.altiproadventures.com/expeditions/expedition/annapurna-i-expedition/";
const ANNAPURNA_I_TIMES: RouteTime[] = [
  {
    id: "annapurna-i-summit-descent",
    label: "Summit → lower camp",
    activity: "mountaineering",
    minHours: 10,
    maxHours: 14,
    scope: "one-way descent",
    sourceUrl: ANNAPURNA_I_SOURCE,
  },
];

// HikerNerd's route guide reports an AMC book-time range for the full Tuckerman out-and-back.
const MOUNT_WASHINGTON_TIMES: RouteTime[] = [
  {
    id: "mount-washington-tuckerman-round-trip",
    label: "Pinkham Notch → Mount Washington summit → Pinkham Notch",
    activity: "hiking",
    minHours: 5,
    maxHours: 8,
    matchTerms: ["Tuckerman Ravine"],
    scope: "round trip",
    sourceUrl:
      "https://hikernerd.com/routes/mount-washington-via-tuckerman-ravine",
  },
];

// One operator's published North Face schedule makes repeated rotations explicit.
const ANNAPURNA_I_ROTATIONS = [
  "Rotation 1: Base Camp → Camp I, overnight, then return to Base Camp; recover before the next rotation.",
  "Rotation 2: Camp I → Camp II, overnight, then return to Base Camp; recover before the next rotation.",
  "Rotation 3: Camp II → Camp III, overnight, then return to Base Camp; recover before summit staging.",
];

export function getExpeditionRouteContext(mountainId: string): {
  sourceUrl: string;
  rotations: string[];
} | null {
  if (mountainId !== "annapurna-i") return null;
  return { sourceUrl: ANNAPURNA_I_SOURCE, rotations: ANNAPURNA_I_ROTATIONS };
}

export function getRouteTimes(
  mountainId: string,
  objective: string,
): RouteTime[] {
  if (objective !== "summit") return [];

  switch (mountainId) {
    case "everest":
      return EVEREST_TIMES;
    case "gasherbrum-ii":
      return GASHERBRUM_II_TIMES;
    case "annapurna-i":
      return ANNAPURNA_I_TIMES;
    case "mount-washington":
      return MOUNT_WASHINGTON_TIMES;
    default:
      return [];
  }
}

// Published combined summit outings replace any shorter model-estimated segment.
export function applySummitOutingTimings(
  stages: {
    title: string;
    effort: {
      label: string;
      activity: string;
      timingId: string | null;
      estimatedHours: string | null;
    }[];
  }[],
  references: RouteTime[],
) {
  const outings = references.filter(
    (reference) => reference.scope === "summit outing",
  );

  for (const outing of outings) {
    if (
      stages.some((stage) =>
        stage.effort.some((effort) => effort.timingId === outing.id),
      )
    ) {
      continue;
    }

    const hasSummitMovement = (stage: (typeof stages)[number]) =>
      stage.effort.some(
        (effort) =>
          /summit/i.test(effort.label) &&
          effort.activity !== "rest" &&
          effort.activity !== "travel",
      );
    const target =
      stages.find(hasSummitMovement) ??
      stages.find(
        (stage) =>
          /summit/i.test(stage.title) &&
          stage.effort.some(
            (effort) =>
              effort.activity !== "rest" && effort.activity !== "travel",
          ),
      ) ??
      stages.find((stage) => /summit/i.test(stage.title));

    if (!target) {
      throw new Error("The itinerary omitted a referenced summit outing.");
    }

    const summitSegments = target.effort
      .map((effort, index) => ({ effort, index }))
      .filter(
        ({ effort }) =>
          /summit/i.test(effort.label) &&
          effort.activity !== "rest" &&
          effort.activity !== "travel",
      );
    const replacement = {
      label: outing.label,
      activity: outing.activity,
      timingId: outing.id,
      estimatedHours: null,
    };

    if (summitSegments.length) {
      const firstIndex = summitSegments[0].index;
      target.effort = target.effort.filter(
        (effort) =>
          !(
            /summit/i.test(effort.label) &&
            effort.activity !== "rest" &&
            effort.activity !== "travel"
          ),
      );
      target.effort.splice(firstIndex, 0, replacement);
    } else {
      const movementIndex = target.effort.findIndex(
        (effort) =>
          effort.activity !== "rest" && effort.activity !== "travel",
      );
      if (movementIndex >= 0) {
        target.effort.splice(movementIndex, 1, replacement);
      } else if (target.effort.length < 6) {
        target.effort.push(replacement);
      } else {
        target.effort.splice(target.effort.length - 1, 1, replacement);
      }
    }
  }
}

// Replace a model's split guesses when a sourced route time covers the full out-and-back.
export function applyRoundTripTimings(
  stages: {
    title: string;
    effort: {
      label: string;
      activity: string;
      timingId: string | null;
      estimatedHours: string | null;
    }[];
  }[],
  references: RouteTime[],
) {
  for (const route of references.filter((item) => item.scope === "round trip")) {
    const target = stages.find((stage) => {
      const content = `${stage.title} ${stage.effort.map((item) => item.label).join(" ")}`.toLowerCase();
      return route.matchTerms?.some((term) => content.includes(term.toLowerCase()));
    });
    if (!target) continue;

    const movementIndices = target.effort.flatMap((item, index) =>
      item.activity === route.activity ? [index] : [],
    );
    if (!movementIndices.length) continue;

    const firstIndex = movementIndices[0];
    const replacement = {
      label: route.label,
      activity: route.activity,
      timingId: route.id,
      estimatedHours: null,
    };
    target.effort = target.effort.filter(
      (item) => item.activity !== route.activity,
    );
    target.effort.splice(firstIndex, 0, replacement);
  }
}

// References must belong to this route and describe the same activity type.
export function validRouteTimings(
  stages: { effort: { timingId: string | null; activity: string }[] }[],
  references: RouteTime[],
): boolean {
  return stages.every((stage) =>
    stage.effort.every(
      (effort) =>
        effort.timingId === null ||
        references.some(
          (reference) =>
            reference.id === effort.timingId &&
            reference.activity === effort.activity,
        ),
    ),
  );
}
