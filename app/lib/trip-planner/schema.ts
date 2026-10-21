import { z } from "zod";

export const MAX_TRIP_DAYS = 120;
export const MAX_DAILY_ITINERARY_DAYS = 21;
export const MAX_EXPEDITION_PHASES = 20;
const MILLISECONDS_PER_DAY = 86_400_000;
export const CURRENCIES = [
  "USD",
  "CAD",
  "EUR",
  "GBP",
  "AUD",
  "NZD",
  "JPY",
  "CHF",
] as const;
export const SEASON_MONTHS = {
  "mar-may": "March–May",
  "jun-aug": "June–August",
  "sep-nov": "September–November",
  "dec-feb": "December–February",
} as const;

export function calendarDayCount(start: string, end: string) {
  return (
    Math.floor(
      (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
        MILLISECONDS_PER_DAY,
    ) + 1
  );
}

// Date-only values use UTC arithmetic so daylight-saving changes cannot add a day.
export function tripDates(start: string, end: string): string[] {
  const dayCount = calendarDayCount(start, end);
  if (!Number.isFinite(dayCount) || dayCount < 1 || dayCount > MAX_TRIP_DAYS)
    return [];

  const departureTime = Date.parse(`${start}T00:00:00Z`);
  return Array.from({ length: dayCount }, (_, index) =>
    new Date(departureTime + index * MILLISECONDS_PER_DAY)
      .toISOString()
      .slice(0, 10),
  );
}

const durationSchema = z.number().int().min(1).max(MAX_TRIP_DAYS).nullable();

// Flexible timing retains the user's intent without inventing exact travel dates.
export const tripTimingSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("recommended"), durationDays: durationSchema }),
  z.object({
    kind: z.literal("season"),
    season: z.enum(["mar-may", "jun-aug", "sep-nov", "dec-feb"]),
    year: z.number().int().min(2000).max(2100),
    durationDays: durationSchema,
  }),
  z.object({
    kind: z.literal("window"),
    earliestDeparture: z.iso.date(),
    latestReturn: z.iso.date(),
    durationDays: durationSchema,
  }),
  z.object({
    kind: z.literal("exact"),
    departureDate: z.iso.date(),
    returnDate: z.iso.date(),
  }),
]);

export const tripInputSchema = z
  .object({
    mountainId: z.string().min(1).max(80),
    timing: tripTimingSchema,
    travelers: z.number().int().min(1).max(12),
    objective: z.enum(["visit", "trek", "summit"]),
    experience: z.enum([
      "beginner",
      "regular",
      "multi-day",
      "high-altitude",
      "high-altitude-summits",
      "technical",
      "expert",
    ]),
    currency: z.enum(CURRENCIES),
    budget: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("unknown") }),
      z.object({
        kind: z.literal("known"),
        amount: z.number().positive().max(1_000_000),
      }),
    ]),
  })
  .superRefine((input, context) => validateTiming(input.timing, context));

const shortTextSchema = z.string().min(1).max(700);
export const itineraryEnvironmentSchema = z.object({
  altitude: z.string().min(1).max(240),
  temperature: z.string().min(1).max(240),
  conditions: z.string().min(1).max(300),
});
const unavailableEnvironment = {
  altitude: "Route and overnight elevations are not verified.",
  temperature: "Typical temperature range is unavailable; check local conditions.",
  conditions: "Review the local forecast and current route conditions before departure.",
};
export const MOVEMENT_HOUR_RANGES = [
  "1-2",
  "2-3",
  "3-4",
  "4-5",
  "5-6",
  "6-7",
  "7-8",
  "8-9",
  "9-10",
  "10-11",
  "11-12",
  "12-13",
  "13-14",
  "14-15",
  "15-16",
  "16-17",
  "17-18",
  "18-19",
  "19-20",
  "20-21",
  "21-22",
  "22-23",
  "23-24",
] as const;
const effortSchema = z
  .array(
    z.object({
      label: z.string().min(1).max(120),
      activity: z.enum([
        "hiking",
        "mountaineering",
        "technical-climbing",
        "rest",
        "travel",
      ]),
      timingId: z.string().min(1).max(80).nullable(),
      // A rough planning band when no operator-published segment timing exists.
      estimatedHours: z.enum(MOVEMENT_HOUR_RANGES).nullable(),
    }),
  )
  .max(6);

const itineraryDaySchema = z.object({
  title: z.string().min(1).max(120),
  activities: z.array(shortTextSchema).min(1).max(4),
  overnight: z.string().min(1).max(200),
  environment: itineraryEnvironmentSchema.default(unavailableEnvironment),
  effort: effortSchema.default([]),
});

export const itinerarySchema = z.object({
  status: z.enum(["draft", "needs-changes"]),
  summary: shortTextSchema,
  timingNote: shortTextSchema,
  budgetNote: shortTextSchema,
  warnings: z
    .array(
      z.object({
        severity: z.enum(["caution", "critical"]),
        title: z.string().min(1).max(120),
        message: shortTextSchema,
      }),
    )
    .max(5),
  assumptions: z.array(shortTextSchema).max(8),
  days: z.array(itineraryDaySchema).max(MAX_DAILY_ITINERARY_DAYS),
  // One representation per draft: detailed days or contiguous expedition phases.
  phases: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        startDay: z.number().int().min(1).max(MAX_TRIP_DAYS),
        endDay: z.number().int().min(1).max(MAX_TRIP_DAYS),
        activities: z.array(z.string().min(1).max(240)).min(1).max(3),
        overnight: z.string().min(1).max(200),
        environment: itineraryEnvironmentSchema.default(unavailableEnvironment),
        decisionNote: z.string().min(1).max(300),
        effort: effortSchema.default([]),
      }),
    )
    .max(MAX_EXPEDITION_PHASES)
    .default([]),
  equipment: z.object({
    mustHave: z.array(z.string().min(1).max(200)).max(24),
    importantToHave: z.array(z.string().min(1).max(200)).max(12),
    niceToHave: z.array(z.string().min(1).max(200)).max(8),
  }),
});

// Strict model providers require every property, even arrays that may be empty.
// Keep the transport default above for previously generated daily drafts.
export const itineraryGenerationSchema = itinerarySchema.extend({
  days: z
    .array(
      itineraryDaySchema.extend({
        environment: itineraryEnvironmentSchema,
        effort: effortSchema.min(1),
      }),
    )
    .max(MAX_DAILY_ITINERARY_DAYS),
  phases: z
    .array(
      itinerarySchema.shape.phases
        .removeDefault()
        .element.extend({
          environment: itineraryEnvironmentSchema,
          effort: effortSchema.min(1),
        }),
    )
    .max(MAX_EXPEDITION_PHASES),
});

export const tripPlanSchema = z
  .object({
    itinerary: itinerarySchema,
    // Only exact-date plans have calendar dates; flexible drafts use numbered days.
    dates: z.array(z.iso.date()).max(MAX_TRIP_DAYS),
  })
  .superRefine(validateItineraryDates);

export type TripTiming = z.infer<typeof tripTimingSchema>;
export type TripInput = z.infer<typeof tripInputSchema>;
export type TripPlan = z.infer<typeof tripPlanSchema>;
export type ItineraryEnvironment = z.infer<typeof itineraryEnvironmentSchema>;

function validateTiming(timing: TripTiming, context: z.RefinementCtx) {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  if (timing.kind === "season") {
    // December–February starts in the selected year and ends the following year.
    const endMonth = {
      "mar-may": "05",
      "jun-aug": "08",
      "sep-nov": "11",
      "dec-feb": "02",
    }[timing.season];
    const endYear = timing.year + (timing.season === "dec-feb" ? 1 : 0);
    if (`${endYear}-${endMonth}` < currentMonth) {
      context.addIssue({
        code: "custom",
        path: ["timing", "year"],
        message: "Choose an upcoming season or year.",
      });
    }
  }

  if (timing.kind !== "exact" && timing.kind !== "window") return;

  const start =
    timing.kind === "exact" ? timing.departureDate : timing.earliestDeparture;
  const end = timing.kind === "exact" ? timing.returnDate : timing.latestReturn;
  const availableDays = calendarDayCount(start, end);

  if (!Number.isFinite(availableDays) || availableDays < 1) {
    context.addIssue({
      code: "custom",
      path: ["timing"],
      message: "The end of your travel window must be on or after its start.",
    });
  }
  if (start < today) {
    context.addIssue({
      code: "custom",
      path: ["timing"],
      message: "Choose an upcoming travel window.",
    });
  }
  if (timing.kind === "exact" && availableDays > MAX_TRIP_DAYS) {
    context.addIssue({
      code: "custom",
      path: ["timing"],
      message: `Trips can cover up to ${MAX_TRIP_DAYS} days.`,
    });
  }
  if (
    timing.kind === "window" &&
    timing.durationDays !== null &&
    timing.durationDays > availableDays
  ) {
    context.addIssue({
      code: "custom",
      path: ["timing"],
      message: "Your trip length must fit inside the travel window.",
    });
  }
}

function validateItineraryDates(
  {
    itinerary,
    dates,
  }: { itinerary: z.infer<typeof itinerarySchema>; dates: string[] },
  context: z.RefinementCtx,
) {
  const isDraft = itinerary.status === "draft";
  const hasEquipment = Object.values(itinerary.equipment).some(
    (items) => items.length > 0,
  );
  const hasCriticalWarning = itinerary.warnings.some(
    (warning) => warning.severity === "critical",
  );
  if (
    hasCriticalWarning &&
    (isDraft ||
      itinerary.days.length ||
      itinerary.phases.length ||
      hasEquipment)
  ) {
    context.addIssue({
      code: "custom",
      path: ["itinerary"],
      message:
        "A critical warning requires changing the plan before scheduling days or equipment.",
    });
  }

  validateMovementTiming(itinerary, context);

  const totalDays = itineraryDuration(itinerary);
  const hasDays = itinerary.days.length > 0;
  const hasPhases = itinerary.phases.length > 0;
  const validRepresentation = isDraft
    ? hasDays !== hasPhases
    : !hasDays && !hasPhases;

  // Gaps, overlaps, and reversed ranges would make the displayed weeks misleading.
  let nextDay = 1;
  for (const phase of itinerary.phases) {
    if (phase.startDay !== nextDay || phase.endDay < phase.startDay) {
      context.addIssue({
        code: "custom",
        path: ["itinerary", "phases"],
        message:
          "Expedition phases must cover consecutive days starting at day 1.",
      });
    }
    nextDay = phase.endDay + 1;
  }

  if (
    !validRepresentation ||
    (isDraft && dates.length > 0 && totalDays !== dates.length)
  ) {
    context.addIssue({
      code: "custom",
      path: ["itinerary"],
      message:
        "Use either daily details or expedition phases covering the requested trip.",
    });
  }

  if (!dates.length) return;

  const expectedDates = tripDates(dates[0], dates[dates.length - 1]);
  if (dates.some((date, index) => date !== expectedDates[index])) {
    context.addIssue({
      code: "custom",
      path: ["dates"],
      message: "Trip dates must be consecutive.",
    });
  }
}

function validateMovementTiming(
  itinerary: z.infer<typeof itinerarySchema>,
  context: z.RefinementCtx,
) {
  const stages = [
    ...itinerary.days.map((day, index) => ({
      path: ["itinerary", "days", index, "effort"] as const,
      effort: day.effort,
    })),
    ...itinerary.phases.map((phase, index) => ({
      path: ["itinerary", "phases", index, "effort"] as const,
      effort: phase.effort,
    })),
  ];

  for (const stage of stages) {
    stage.effort.forEach((item, index) => {
      const isMovement =
        item.activity === "hiking" ||
        item.activity === "mountaineering" ||
        item.activity === "technical-climbing";
      const hasRouteReference = item.timingId !== null;
      const hasEstimate = item.estimatedHours !== null;
      const validTiming = isMovement
        ? hasRouteReference !== hasEstimate
        : !hasRouteReference && !hasEstimate;

      if (!validTiming) {
        context.addIssue({
          code: "custom",
          path: [...stage.path, index],
          message: isMovement
            ? "Movement needs either a route-time reference or an estimate, not both."
            : "Rest and travel entries cannot include hiking or climbing time.",
        });
      }
    });
  }
}

// Phase counts are not durations: use the last covered day when checking windows.
export function itineraryDuration(
  itinerary: Pick<TripPlan["itinerary"], "days" | "phases">,
): number {
  return itinerary.phases.length
    ? itinerary.phases[itinerary.phases.length - 1].endDay
    : itinerary.days.length;
}
