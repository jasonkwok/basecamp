import assert from "node:assert/strict";
import test from "node:test";
import {
  getEquipmentReference,
  mergeEquipmentReference,
  filterClimbingEquipment,
} from "../app/lib/trip-planner/equipment-reference.ts";
import { readFileSync } from "node:fs";
const catalog = JSON.parse(
  readFileSync(new URL("../app/data/mountains.json", import.meta.url), "utf8"),
).mountains;
import {
  assessTripSuitability,
  createUnsuitableTripPlan,
} from "../app/lib/trip-planner/trip-suitability.ts";
import { MOUNTAIN_EXPERIENCE } from "../app/lib/trip-planner/experience-levels.ts";
import {
  MOVEMENT_HOUR_RANGES,
  tripDates,
  tripInputSchema,
  tripPlanSchema,
} from "../app/lib/trip-planner/schema.ts";
import { createMockItinerary } from "../app/lib/trip-planner/mock-itinerary.ts";
const itineraryPromptSource = readFileSync(
  new URL("../app/lib/trip-planner/itinerary-prompt.ts", import.meta.url),
  "utf8",
);
import {
  buildItineraryMarkdown,
  itineraryMarkdownFilename,
} from "../app/components/trip-planner/itinerary/itinerary-markdown.ts";

const year = new Date().getUTCFullYear() + 1;
const input = {
  mountainId: "table-mountain",
  timing: {
    kind: "exact",
    departureDate: `${year}-05-01`,
    returnDate: `${year}-05-05`,
  },
  travelers: 2,
  objective: "visit",
  experience: "beginner",
  currency: "GBP",
  budget: { kind: "unknown" },
};

test("Markdown export includes trip details, schedule, warnings, and equipment", () => {
  const summit = catalog.find((mountain) => mountain.id === input.mountainId);
  const plan = createMockItinerary(input, summit, [
    `${year}-05-01`,
    `${year}-05-02`,
  ], 2);
  const markdown = buildItineraryMarkdown({
    plan,
    input,
    summit,
    equipment: {
      mustHave: ["Waterproof hiking boots"],
      importantToHave: ["Trekking poles"],
      niceToHave: [],
    },
  });

  assert.match(markdown, /^# Table Mountain adventure plan/m);
  assert.doesNotMatch(markdown, /London|\*\*From:\*\*/);
  assert.match(markdown, /## Warnings/);
  assert.match(markdown, /### Day 1 ·/);
  assert.match(markdown, /Typical temperature/);
  assert.match(markdown, /Approx\. 3–4 hours/);
  assert.doesNotMatch(markdown, /planning estimate/);
  assert.match(markdown, /Trekking poles/);
  assert.doesNotMatch(markdown, /Waterproof hiking boots/);
  assert.match(markdown, /AI-generated planning draft/);
});

test("long phase exports include exact dates when available", () => {
  const summit = catalog.find((mountain) => mountain.id === "mount-washington");
  const phaseInput = {
    ...input,
    mountainId: summit.id,
    timing: { kind: "recommended", durationDays: 30 },
    objective: "summit",
  };
  const dates = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(year, 4, 1 + index));
    return date.toISOString().slice(0, 10);
  });
  const plan = createMockItinerary(phaseInput, summit, dates, dates.length);
  const markdown = buildItineraryMarkdown({
    plan,
    input: phaseInput,
    summit,
    equipment: { mustHave: [], importantToHave: [], niceToHave: [] },
  });

  assert.match(markdown, /### Weeks? \d+.*Days \d+–\d+ · May/);
});

test("itinerary export filename is a safe mountain-name slug", () => {
  assert.equal(
    itineraryMarkdownFilename("Aoraki / Mount Cook"),
    "aoraki-mount-cook-itinerary.md",
  );
  assert.equal(itineraryMarkdownFilename("雪山"), "trip-itinerary.md");
});

test("unknown budget is valid without an amount; known budget requires a positive amount", () => {
  assert.equal(tripInputSchema.safeParse(input).success, true);
  for (const amount of [0, -1, undefined, NaN]) {
    assert.equal(
      tripInputSchema.safeParse({ ...input, budget: { kind: "known", amount } })
        .success,
      false,
    );
  }
  assert.equal(
    tripInputSchema.safeParse({
      ...input,
      budget: { kind: "known", amount: 2500 },
    }).success,
    true,
  );
});

test("itinerary prompt passes party size and requires a tailored budget note", () => {
  assert.match(itineraryPromptSource, /travelerCount:\s*input\.travelers/);
  assert.match(itineraryPromptSource, /state that count/);
  assert.match(itineraryPromptSource, /Do not invent a group total/);
});

test("date windows are inclusive and independent of daylight saving", () => {
  assert.equal(tripDates(`${year}-03-12`, `${year}-03-16`).length, 5);
  assert.deepEqual(tripDates(`${year}-05-01`, `${year}-05-01`), [
    `${year}-05-01`,
  ]);
  assert.equal(tripDates(`${year}-05-01`, `${year}-05-21`).length, 21);
  assert.equal(tripDates(`${year}-05-01`, `${year}-05-22`).length, 22);
  assert.deepEqual(tripDates(`${year}-01-01`, `${year}-12-31`), []);
  assert.deepEqual(tripDates(`${year}-05-05`, `${year}-05-01`), []);
});

test("rejects impossible or past dates and malformed trip parameters", () => {
  for (const changes of [
    { timing: { ...input.timing, departureDate: `${year}-02-30` } },
    {
      timing: {
        kind: "exact",
        departureDate: "2000-01-01",
        returnDate: "2000-01-05",
      },
    },
    { timing: { ...input.timing, returnDate: `${year}-04-30` } },
    { timing: { ...input.timing, returnDate: `${year}-12-31` } },
    { travelers: 0 },
    { travelers: 1.5 },
    { travelers: 13 },
    { currency: "made-up" },
    { objective: "instructions" },
  ]) {
    assert.equal(
      tripInputSchema.safeParse({ ...input, ...changes }).success,
      false,
    );
  }
});

test("result validation rejects missing days, mismatched status, and nonconsecutive dates", () => {
  const day = {
    title: "Visit",
    activities: ["Explore the area."],
    overnight: "Hotel",
  };
  const plan = {
    dates: [`${year}-05-01`, `${year}-05-02`],
    itinerary: {
      status: "draft",
      summary: "A visit.",
      timingNote: "Dates selected by the traveler.",
      budgetNote: "Budget unknown.",
      assumptions: [],
      equipment: { mustHave: [], importantToHave: [], niceToHave: [] },
      warnings: [],
      days: [day, day],
    },
  };
  assert.equal(tripPlanSchema.safeParse(plan).success, true);
  assert.equal(
    tripPlanSchema.safeParse({
      ...plan,
      itinerary: { ...plan.itinerary, days: [day] },
    }).success,
    false,
  );
  assert.equal(
    tripPlanSchema.safeParse({
      ...plan,
      itinerary: { ...plan.itinerary, status: "needs-changes" },
    }).success,
    false,
  );
  assert.equal(
    tripPlanSchema.safeParse({
      ...plan,
      dates: [`${year}-05-01`, `${year}-05-03`],
    }).success,
    false,
  );
  assert.equal(
    tripPlanSchema.safeParse({
      ...plan,
      itinerary: { ...plan.itinerary, status: "needs-changes", days: [] },
    }).success,
    true,
  );
});

test("itinerary movement entries require exactly one kind of timing", () => {
  const plan = {
    dates: [`${year}-05-01`],
    itinerary: {
      status: "draft",
      summary: "A one-day route draft.",
      timingNote: "Dates selected by the traveler.",
      budgetNote: "Budget unknown.",
      assumptions: [],
      equipment: { mustHave: [], importantToHave: [], niceToHave: [] },
      warnings: [],
      phases: [],
      days: [
        {
          title: "Trailhead to summit and back",
          activities: ["Follow the named route and return to the trailhead."],
          overnight: "Hotel near the trailhead",
          effort: [
            {
              label: "Full round trip",
              activity: "hiking",
              timingId: null,
              estimatedHours: "6-7",
            },
          ],
        },
      ],
    },
  };

  assert.equal(tripPlanSchema.safeParse(plan).success, true);

  const missingTime = structuredClone(plan);
  missingTime.itinerary.days[0].effort[0].estimatedHours = null;
  assert.equal(tripPlanSchema.safeParse(missingTime).success, false);

  const doubleTimed = structuredClone(plan);
  doubleTimed.itinerary.days[0].effort[0].timingId = "route-reference";
  assert.equal(tripPlanSchema.safeParse(doubleTimed).success, false);

  const timedRest = structuredClone(plan);
  timedRest.itinerary.days[0].effort[0] = {
    label: "Weather hold",
    activity: "rest",
    timingId: null,
    estimatedHours: "1-2",
  };
  assert.equal(tripPlanSchema.safeParse(timedRest).success, false);
});

test("recommended and seasonal timing permit unknown duration without dates", () => {
  for (const timing of [
    { kind: "recommended", durationDays: null },
    { kind: "season", season: "dec-feb", year, durationDays: null },
  ]) {
    const result = tripInputSchema.safeParse({ ...input, timing });
    assert.equal(result.success, true);
    assert.equal("departureDate" in result.data.timing, false);
  }
});

test("rejects unsupported timing kinds, past dates, and invalid durations", () => {
  for (const timing of [
    { kind: "month", month: `${year}-05`, durationDays: 7 },
    {
      kind: "window",
      earliestDeparture: `${year}-05-01`,
      latestReturn: `${year}-07-01`,
      durationDays: 7,
    },
    { kind: "season", season: "mar-may", year: 2000, durationDays: 5 },
    { kind: "recommended", durationDays: 121 },
    { kind: "recommended", durationDays: 0 },
    { kind: "recommended", durationDays: 1.5 },
  ]) {
    assert.equal(
      tripInputSchema.safeParse({ ...input, timing }).success,
      false,
    );
  }
});

test("an undated draft has numbered days; clarification contains no scheduled days", () => {
  const itinerary = {
    status: "draft",
    summary: "Flexible visit.",
    timingNote: "Choose a month later.",
    budgetNote: "Unknown.",
    assumptions: [],
    equipment: { mustHave: [], importantToHave: [], niceToHave: [] },
    warnings: [],
    days: [{ title: "Arrival", activities: ["Travel."], overnight: "Hotel" }],
  };
  assert.equal(
    tripPlanSchema.safeParse({ dates: [], itinerary }).success,
    true,
  );
  assert.equal(
    tripPlanSchema.safeParse({
      dates: [],
      itinerary: { ...itinerary, days: [] },
    }).success,
    false,
  );
  assert.equal(
    tripPlanSchema.safeParse({
      dates: [],
      itinerary: { ...itinerary, status: "needs-changes", days: [] },
    }).success,
    true,
  );
});

test("accepts the displayed hiking, altitude, and technical experience levels", () => {
  for (const experience of Object.keys(MOUNTAIN_EXPERIENCE)) {
    assert.equal(
      tripInputSchema.safeParse({ ...input, experience }).success,
      true,
    );
  }
  assert.equal(
    tripInputSchema.safeParse({ ...input, experience: "unrecognized" }).success,
    false,
  );
});

const everest = {
  name: "Everest",
  difficulty: {
    level: "extreme",
    ascent: "South Col expedition ascent",
    rationale: "Extreme altitude, glacier travel and exposed climbing.",
  },
};

test("beginners requesting Everest's summit receive a critical warning and no ascent plan", () => {
  const warning = assessTripSuitability(
    { objective: "summit", experience: "beginner" },
    everest,
  );
  assert.equal(warning.severity, "critical");
  assert.match(warning.message, /should not attempt to summit Everest/);
  const plan = createUnsuitableTripPlan(warning, []);
  assert.equal(tripPlanSchema.safeParse(plan).success, true);
  assert.equal(plan.itinerary.status, "needs-changes");
  assert.deepEqual(plan.itinerary.days, []);
  assert.deepEqual(plan.itinerary.equipment, {
    mustHave: [],
    importantToHave: [],
    niceToHave: [],
  });
});

test("Annapurna I blocks a beginner summit request but allows expert planning", () => {
  const annapurna = catalog.find((entry) => entry.id === "annapurna-i");
  const beginnerWarning = assessTripSuitability(
    { objective: "summit", experience: "beginner" },
    annapurna,
  );

  assert.equal(beginnerWarning.severity, "critical");
  assert.match(beginnerWarning.message, /should not attempt to summit Annapurna I/);
  const beginnerPlan = createUnsuitableTripPlan(beginnerWarning, []);
  assert.equal(beginnerPlan.itinerary.status, "needs-changes");
  assert.deepEqual(beginnerPlan.itinerary.days, []);
  assert.deepEqual(beginnerPlan.itinerary.phases, []);
  assert.equal(
    assessTripSuitability(
      { objective: "summit", experience: "expert" },
      annapurna,
    ),
    null,
  );
});

test("high-altitude trekking experience does not bypass technical or extreme summit checks", () => {
  for (const experience of [
    "beginner",
    "regular",
    "multi-day",
    "high-altitude",
    "high-altitude-summits",
  ]) {
    assert.equal(
      assessTripSuitability({ objective: "summit", experience }, everest)
        .severity,
      "critical",
    );
    assert.equal(
      assessTripSuitability(
        { objective: "summit", experience },
        { ...everest, difficulty: { ...everest.difficulty, level: "expert" } },
      ).severity,
      "critical",
    );
  }
});

test("the summit policy does not classify sightseeing, trekking, or every ascent as an extreme summit", () => {
  for (const objective of ["visit", "trek"]) {
    assert.equal(
      assessTripSuitability({ objective, experience: "beginner" }, everest),
      null,
    );
  }
  assert.equal(
    assessTripSuitability(
      { objective: "summit", experience: "beginner" },
      {
        ...everest,
        difficulty: { ...everest.difficulty, level: "intermediate" },
      },
    ),
    null,
  );
  assert.equal(
    assessTripSuitability(
      { objective: "summit", experience: "expert" },
      everest,
    ),
    null,
  );
});

test("critical warnings cannot accompany an actionable ascent itinerary", () => {
  const plan = createUnsuitableTripPlan(
    assessTripSuitability(
      { objective: "summit", experience: "beginner" },
      everest,
    ),
    [],
  );
  const invalid = {
    ...plan,
    itinerary: {
      ...plan.itinerary,
      status: "draft",
      days: [
        { title: "Climb", activities: ["Attempt summit"], overnight: "Camp" },
      ],
    },
  };
  assert.equal(tripPlanSchema.safeParse(invalid).success, false);
});

test("a model critical warning clears the generated schedule and equipment", async () => {
  const { prepareGeneratedItinerary } = await import(
    "../app/lib/trip-planner/validate-generated-itinerary.ts"
  );
  const summit = catalog.find((mountain) => mountain.id === "table-mountain");
  const draft = createMockItinerary(input, summit, [], 3).itinerary;
  draft.warnings.push({
    severity: "critical",
    title: "Objective needs revision",
    message: "Change the objective before planning this trip.",
  });

  const prepared = prepareGeneratedItinerary(draft, []);

  assert.equal(prepared.status, "needs-changes");
  assert.deepEqual(prepared.days, []);
  assert.deepEqual(prepared.phases, []);
  assert.deepEqual(prepared.equipment, {
    mustHave: [],
    importantToHave: [],
    niceToHave: [],
  });
  assert.equal(
    tripPlanSchema.safeParse({ dates: [], itinerary: prepared }).success,
    true,
  );
});

test("every catalog mountain and objective receives essential equipment tiers", () => {
  for (const summit of catalog) {
    for (const objective of ["visit", "trek", "summit"]) {
      const reference = getEquipmentReference(summit, objective);
      for (const items of [reference.mustHave, reference.importantToHave])
        assert.ok(items.length > 0, `${summit.id}: ${objective}`);
      if (objective !== "summit")
        assert.ok(!reference.mustHave.includes("Crampons"));
    }
  }
});

test("snow ascent essentials stay critical across the catalog, including K2", () => {
  for (const summit of catalog.filter(
    (entry) => entry.difficulty.level === "extreme",
  )) {
    const reference = getEquipmentReference(summit, "summit");
    const equipment = mergeEquipmentReference(reference, {
      mustHave: [],
      importantToHave: ["Crampons"],
      niceToHave: ["Two technical ice tools for steep ice", "Camera"],
    });
    assert.ok(equipment.mustHave.includes("Mountaineering ice axe"), summit.id);
    assert.ok(equipment.mustHave.includes("Crampons"), summit.id);
    assert.ok(!equipment.importantToHave.includes("Crampons"));
    assert.ok(
      !equipment.niceToHave.includes("Two technical ice tools for steep ice"),
    );
    assert.ok(
      equipment.mustHave.includes("Two technical ice tools for steep ice"),
    );
  }
});

test("dry walking and rock routes do not inherit glacier equipment", () => {
  for (const id of [
    "longs-peak",
    "mount-washington",
    "fitz-roy",
    "grand-teton",
  ]) {
    const summit = catalog.find((entry) => entry.id === id);
    assert.ok(
      !getEquipmentReference(summit, "summit").mustHave.includes("Crampons"),
      id,
    );
  }
});

test("equipment requires all three explicitly named priority groups", () => {
  const plan = createUnsuitableTripPlan(
    assessTripSuitability(
      { objective: "summit", experience: "beginner" },
      everest,
    ),
    [],
  );
  assert.equal(
    tripPlanSchema.safeParse({
      ...plan,
      itinerary: { ...plan.itinerary, equipment: ["Ice axe"] },
    }).success,
    false,
  );
  const invalid = {
    ...plan,
    itinerary: {
      ...plan.itinerary,
      equipment: { ...plan.itinerary.equipment, niceToHave: ["Ice axe"] },
    },
  };
  assert.equal(tripPlanSchema.safeParse(invalid).success, false);
});

test("Everest reference specifies technical essentials and promotes optional snow gear", async () => {
  const { getEverestEquipment } =
    await import("../app/lib/trip-planner/everest-equipment.ts");
  const reference = getEverestEquipment();
  for (const item of [
    "Crampons",
    "Mountaineering ice axe",
    "High-altitude boots",
    "Alpine harness",
    "Fixed-rope ascender",
    "Rappel device",
    "Supplemental oxygen",
  ]) {
    assert.ok(
      reference.mustHave.some((entry) => entry.startsWith(item)),
      item,
    );
  }
  assert.ok(reference.mustHave.some((item) => item.includes("12-point")));
  assert.equal(reference.niceToHave.length, 0);
  const result = mergeEquipmentReference(reference, {
    mustHave: [],
    importantToHave: [],
    niceToHave: ["Ice axe"],
  });
  assert.equal(result.mustHave.filter((item) => /ice axe/i.test(item)).length, 1);
  assert.ok(!result.niceToHave.includes("Ice axe"));
});

test("mock drafts validate for exact and flexible timing without AI", async () => {
  const { createMockItinerary } =
    await import("../app/lib/trip-planner/mock-itinerary.ts");
  const summit = catalog.find((entry) => entry.id === "table-mountain");
  const dates = tripDates(input.timing.departureDate, input.timing.returnDate);
  const plan = createMockItinerary(input, summit, dates, dates.length);
  assert.equal(tripPlanSchema.safeParse(plan).success, true);
  assert.match(plan.itinerary.summary, /Mock preview/);
  const flexible = createMockItinerary(input, summit, [], 3);
  assert.equal(tripPlanSchema.safeParse(flexible).success, true);
  assert.equal(flexible.itinerary.days.length, 3);
  const everest = catalog.find((entry) => entry.id === "everest");
  const longExpedition = createMockItinerary(
    { ...input, objective: "summit" },
    everest,
    [],
    3,
  );
  assert.equal(longExpedition.itinerary.status, "needs-changes");
  assert.equal(longExpedition.itinerary.days.length, 0);
});

test("generated itinerary checks reject missing estimates and mismatched trip length", async () => {
  const { createMockItinerary } =
    await import("../app/lib/trip-planner/mock-itinerary.ts");
  const {
    prepareGeneratedItinerary,
    validateGeneratedItinerary,
  } = await import("../app/lib/trip-planner/validate-generated-itinerary.ts");
  const summit = catalog.find((entry) => entry.id === "table-mountain");
  const trip = createMockItinerary(input, summit, [], 3);
  const generated = prepareGeneratedItinerary(
    structuredClone(trip.itinerary),
    [],
  );

  assert.equal(
    validateGeneratedItinerary({
      itinerary: generated,
      dates: [],
      requestedDays: 3,
      timing: { kind: "recommended", durationDays: 3 },
      routeTimes: [],
    }).itinerary.days.length,
    3,
  );

  const missingEstimate = structuredClone(generated);
  missingEstimate.days[0].effort[0].estimatedHours = null;
  assert.throws(
    () =>
      validateGeneratedItinerary({
        itinerary: missingEstimate,
        dates: [],
        requestedDays: 3,
        timing: { kind: "recommended", durationDays: 3 },
        routeTimes: [],
      }),
    /missing movement-time estimates/,
  );

  assert.throws(
    () =>
      validateGeneratedItinerary({
        itinerary: generated,
        dates: [],
        requestedDays: 4,
        timing: { kind: "recommended", durationDays: 4 },
        routeTimes: [],
      }),
    /did not match the requested trip length/,
  );

  const foreignRouteTime = structuredClone(generated);
  foreignRouteTime.days[0].effort[0].timingId = "another-mountain-route";
  foreignRouteTime.days[0].effort[0].estimatedHours = null;
  assert.throws(
    () =>
      validateGeneratedItinerary({
        itinerary: foreignRouteTime,
        dates: [],
        requestedDays: 3,
        timing: { kind: "recommended", durationDays: 3 },
        routeTimes: [],
      }),
    /did not match this route/,
  );
});

test("every catalog mountain can produce a renderable draft in mock mode", async () => {
  const { createMockItinerary } =
    await import("../app/lib/trip-planner/mock-itinerary.ts");

  for (const summit of catalog) {
    for (const objective of ["visit", "trek", "summit"]) {
      const preferences = {
        ...input,
        objective,
        experience: "expert",
        timing: {
          kind: "recommended",
          durationDays:
            objective === "summit" ? summit.tripLength.minDays + 4 : 3,
        },
      };
      const dayCount = preferences.timing.durationDays;
      const plan = createMockItinerary(preferences, summit, [], dayCount);

      assert.equal(
        tripPlanSchema.safeParse(plan).success,
        true,
        `${summit.id}: ${objective}`,
      );
      assert.equal(plan.itinerary.status, "draft", `${summit.id}: ${objective}`);
      assert.ok(
        plan.itinerary.days.length || plan.itinerary.phases.length,
        `${summit.id}: ${objective} should have a visible schedule`,
      );

      const stages = [...plan.itinerary.days, ...plan.itinerary.phases];
      for (const stage of stages) {
        for (const effort of stage.effort) {
          if (["rest", "travel"].includes(effort.activity)) {
            assert.equal(effort.estimatedHours, null, summit.id);
            assert.equal(effort.timingId, null, summit.id);
            continue;
          }

          assert.ok(
            effort.timingId || effort.estimatedHours,
            `${summit.id}: ${objective} has untimed movement: ${effort.label}`,
          );
        }
      }
    }
  }
});

test("long expeditions validate contiguous phases and reject gaps or mixed formats", async () => {
  const { createMockItinerary } =
    await import("../app/lib/trip-planner/mock-itinerary.ts");
  const summit = catalog.find((entry) => entry.id === "everest");
  const preferences = {
    ...input,
    objective: "summit",
    experience: "expert",
    timing: { kind: "recommended", durationDays: 60 },
  };
  assert.equal(tripInputSchema.safeParse(preferences).success, true);
  const plan = createMockItinerary(preferences, summit, [], 60);
  assert.equal(tripPlanSchema.safeParse(plan).success, true);
  assert.equal(plan.itinerary.days.length, 0);
  assert.equal(plan.itinerary.phases.at(-1).endDay, 60);
  const withDates = {
    ...plan,
    dates: tripDates(`${year}-05-01`, `${year}-06-29`),
  };
  assert.equal(tripPlanSchema.safeParse(withDates).success, true);
  assert.equal(
    tripPlanSchema.safeParse({ ...withDates, dates: withDates.dates.slice(1) })
      .success,
    false,
  );
  for (const change of [{ startDay: 2 }, { endDay: 0 }, { endDay: 121 }]) {
    const altered = structuredClone(plan);
    Object.assign(altered.itinerary.phases[0], change);
    assert.equal(tripPlanSchema.safeParse(altered).success, false);
  }
  const overlap = structuredClone(plan);
  overlap.itinerary.phases[1].startDay -= 1;
  assert.equal(tripPlanSchema.safeParse(overlap).success, false);
  const mixed = structuredClone(plan);
  mixed.itinerary.days = [
    { title: "Extra day", activities: ["Unscheduled"], overnight: "Camp" },
  ];
  assert.equal(tripPlanSchema.safeParse(mixed).success, false);
  const blocked = structuredClone(plan);
  blocked.itinerary.status = "needs-changes";
  blocked.itinerary.warnings = [
    {
      severity: "critical",
      title: "Do not climb",
      message: "Experience mismatch",
    },
  ];
  assert.equal(tripPlanSchema.safeParse(blocked).success, false);
});

test("model output schema requires every property for strict providers", async () => {
  const { z } = await import("zod");
  const { itineraryGenerationSchema } =
    await import("../app/lib/trip-planner/schema.ts");
  const schema = z.toJSONSchema(itineraryGenerationSchema);
  function checkRequiredFields(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "object" && node.properties) {
      assert.deepEqual(
        [...node.required].sort(),
        Object.keys(node.properties).sort(),
      );
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(checkRequiredFields);
      else if (value && typeof value === "object") checkRequiredFields(value);
    }
  }
  checkRequiredFields(schema);
  assert.ok(schema.required.includes("phases"));
});

test("unsourced movement estimates use one-hour planning ranges", () => {
  assert.equal(MOVEMENT_HOUR_RANGES[0], "1-2");
  assert.equal(MOVEMENT_HOUR_RANGES.at(-1), "23-24");
  for (const [index, range] of MOVEMENT_HOUR_RANGES.entries()) {
    const [start, end] = range.split("-").map(Number);
    assert.equal(end - start, 1, range);
    if (index > 0) {
      assert.equal(start, Number(MOVEMENT_HOUR_RANGES[index - 1].split("-")[0]) + 1);
    }
  }
});

test("every catalog route has an ordered USD allowance with an explicit basis", async () => {
  const { getMountainBudget, formatMountainBudget } =
    await import("../app/data/mountain-budgets.ts");
  for (const summit of catalog) {
    const budget = getMountainBudget(summit);
    assert.ok(Number.isFinite(budget.minUsd) && budget.minUsd > 0, summit.id);
    assert.ok(budget.maxUsd >= budget.minUsd, summit.id);
    assert.ok(budget.basis.length > 0);
    assert.ok(
      ["price-informed", "rough-allowance"].includes(budget.confidence),
    );
    assert.match(formatMountainBudget(budget), /USD$/);
  }
});

test("movement references are route-specific and preserve ascent/descent distinctions", async () => {
  const {
    applyRoundTripTimings,
    applySummitOutingTimings,
    getExpeditionRouteContext,
    getRouteTimes,
    validRouteTimings,
  } =
    await import("../app/data/route-times.ts");
  const { createMockItinerary } =
    await import("../app/lib/trip-planner/mock-itinerary.ts");
  const references = getRouteTimes("everest", "summit");
  const ascent = references.find((item) => item.id === "everest-c4-summit");
  const descent = references.find((item) => item.id === "everest-summit-c4");
  assert.equal(ascent.minHours, 8);
  assert.equal(ascent.maxHours, 12);
  assert.equal(descent.maxHours, 4);
  assert.notEqual(ascent.scope, descent.scope);
  const gasherbrum = getRouteTimes("gasherbrum-ii", "summit");
  assert.equal(gasherbrum.length, 1);
  assert.equal(gasherbrum[0].label, "Camp 3 → summit → Camp 2");
  assert.equal(gasherbrum[0].minHours, 12);
  assert.equal(gasherbrum[0].maxHours, 14);
  assert.equal(gasherbrum[0].scope, "summit outing");
  assert.match(gasherbrum[0].sourceUrl, /expeditions-unlimited\.com/);
  const annapurna = getRouteTimes("annapurna-i", "summit");
  assert.equal(annapurna.length, 1);
  assert.equal(annapurna[0].label, "Summit → lower camp");
  assert.equal(annapurna[0].minHours, 10);
  assert.equal(annapurna[0].maxHours, 14);
  assert.equal(annapurna[0].scope, "one-way descent");
  assert.match(annapurna[0].sourceUrl, /altiproadventures\.com/);
  const annapurnaPlan = getExpeditionRouteContext("annapurna-i");
  assert.equal(annapurnaPlan.rotations.length, 3);
  assert.match(annapurnaPlan.rotations[0], /return to Base Camp; recover/);
  assert.equal(getExpeditionRouteContext("k2"), null);
  const washington = getRouteTimes("mount-washington", "summit");
  assert.equal(washington.length, 1);
  assert.equal(washington[0].scope, "round trip");
  assert.equal(washington[0].minHours, 5);
  assert.equal(washington[0].maxHours, 8);
  assert.match(washington[0].label, /Pinkham Notch.*summit.*Pinkham Notch/);
  const washingtonDay = {
    title: "Mount Washington via Tuckerman Ravine Trail",
    effort: [
      {
        label: "Ascent via Tuckerman Ravine Trail",
        activity: "hiking",
        timingId: null,
        estimatedHours: "6-7",
      },
      {
        label: "Descent via Tuckerman Ravine Trail",
        activity: "hiking",
        timingId: null,
        estimatedHours: "3-4",
      },
      {
        label: "Return to Pinkham Notch",
        activity: "travel",
        timingId: null,
        estimatedHours: null,
      },
    ],
  };
  applyRoundTripTimings([washingtonDay], washington);
  assert.deepEqual(
    washingtonDay.effort.map((item) => item.label),
    [
      "Pinkham Notch → Mount Washington summit → Pinkham Notch",
      "Return to Pinkham Notch",
    ],
  );
  assert.equal(washingtonDay.effort[0].timingId, washington[0].id);
  const g2 = catalog.find((item) => item.id === "gasherbrum-ii");
  const g2Plan = createMockItinerary(
    {
      ...input,
      objective: "summit",
      experience: "expert",
      timing: { kind: "recommended", durationDays: g2.tripLength.minDays + 4 },
    },
    g2,
    [],
    g2.tripLength.minDays + 4,
    gasherbrum,
  );
  assert.ok(
    g2Plan.itinerary.phases
      .flatMap((phase) => phase.effort)
      .some((item) => item.timingId === gasherbrum[0].id),
  );
  const generatedSummitPhase = {
    title: "Summit attempt",
    effort: [
      {
        label: "Camp 3 → summit",
        activity: "mountaineering",
        timingId: null,
        estimatedHours: "9-10",
      },
      {
        label: "Summit → Camp 2",
        activity: "mountaineering",
        timingId: null,
        estimatedHours: "3-4",
      },
      {
        label: "Camp 2 → Camp 3",
        activity: "mountaineering",
        timingId: null,
        estimatedHours: "3-4",
      },
    ],
  };
  applySummitOutingTimings([generatedSummitPhase], gasherbrum);
  assert.deepEqual(
    generatedSummitPhase.effort.map((item) => item.label),
    ["Camp 3 → summit → Camp 2", "Camp 2 → Camp 3"],
  );
  assert.deepEqual(getRouteTimes("everest", "trek"), []);
  assert.deepEqual(getRouteTimes("gasherbrum-ii", "visit"), []);
  const stages = [
    { effort: [{ timingId: ascent.id, activity: ascent.activity }] },
  ];
  assert.equal(validRouteTimings(stages, references), true);
  assert.equal(validRouteTimings(stages, getRouteTimes("k2", "summit")), false);
  assert.equal(
    validRouteTimings(
      [{ effort: [{ timingId: ascent.id, activity: "rest" }] }],
      references,
    ),
    false,
  );
  assert.equal(
    validRouteTimings(
      [{ effort: [{ timingId: null, activity: "hiking" }] }],
      [],
    ),
    true,
  );
});

test("every catalog mountain has a route profile without inventing trek elevations", async () => {
  const { getRouteProfile } = await import("../app/data/route-profiles.ts");
  for (const mountain of catalog) {
    const summitProfile = getRouteProfile(mountain, "summit");
    assert.equal(summitProfile.route, mountain.difficulty.ascent);
    if (mountain.kind === "mountain") {
      assert.equal(summitProfile.points[0].elevationMeters, mountain.elevationMeters);
    }
    assert.deepEqual(getRouteProfile(mountain, "trek").points, []);
    assert.deepEqual(getRouteProfile(mountain, "visit").points, []);
  }
});

test("route elevation checks clear invented endpoints and retain sourced summit height", async () => {
  const { getRouteProfile } = await import("../app/data/route-profiles.ts");
  const { applyRouteElevationReferences, formatAltitudeChange } = await import("../app/lib/trip-planner/stage-route-details.ts");
  for (const mountain of catalog.filter(m => m.kind === "mountain")) {
    const stages = [{ routeDetails: { difficulty: mountain.difficulty.rationale, altitudeChanges: [
      { from: "Unverified trailhead", to: "Summit", fromMeters: 1234, toMeters: 999 },
    ] } }];
    applyRouteElevationReferences(stages, getRouteProfile(mountain, "summit"));
    const movement = stages[0].routeDetails.altitudeChanges[0];
    assert.equal(movement.fromMeters, null, mountain.id);
    assert.equal(movement.toMeters, mountain.elevationMeters, mountain.id);
    assert.equal(formatAltitudeChange(movement).change, null);
  }
});

test("a rotation displays ascent and descent separately instead of zero net gain", async () => {
  const { getRouteProfile } = await import("../app/data/route-profiles.ts");
  const { applyRouteElevationReferences, formatAltitudeChange } = await import("../app/lib/trip-planner/stage-route-details.ts");
  const everest = catalog.find(m => m.id === "everest");
  const stages = [{ routeDetails: { difficulty: "Glacier travel and altitude.", altitudeChanges: [
    { from: "Base Camp", to: "Camp II", fromMeters: null, toMeters: null },
    { from: "Camp 2", to: "Base Camp", fromMeters: null, toMeters: null },
  ] } }];
  applyRouteElevationReferences(stages, getRouteProfile(everest, "summit"));
  assert.match(formatAltitudeChange(stages[0].routeDetails.altitudeChanges[0]).change, /^\+1,036 m/);
  assert.match(formatAltitudeChange(stages[0].routeDetails.altitudeChanges[1]).change, /^−1,036 m/);
  assert.match(formatAltitudeChange(stages[0].routeDetails.altitudeChanges[0]).route, /5,364 m/);
});

test("new generated stages require concise activities, difficulty and altitude movements", async () => {
  const { itineraryGenerationSchema } = await import("../app/lib/trip-planner/schema.ts");
  const mountain = catalog.find(m => m.id === "mount-fuji");
  const plan = createMockItinerary({ ...input, objective: "summit" }, mountain, [], 3);
  const details = { difficulty: "Loose volcanic footing on the named ascent.", altitudeChanges: [
    { from: "Trailhead", to: "Summit", fromMeters: null, toMeters: mountain.elevationMeters },
  ] };
  for (const day of plan.itinerary.days) day.routeDetails = structuredClone(details);
  assert.equal(itineraryGenerationSchema.safeParse(plan.itinerary).success, true);
  const missing = structuredClone(plan.itinerary);
  delete missing.days[0].routeDetails;
  assert.equal(itineraryGenerationSchema.safeParse(missing).success, false);
  const verbose = structuredClone(plan.itinerary);
  verbose.days[0].activities = ["First bullet.", "Second bullet.", "Unnecessary third bullet."];
  assert.equal(itineraryGenerationSchema.safeParse(verbose).success, false);
});

test("Markdown preserves stage difficulty and both altitude directions", () => {
  const mountain = catalog.find(m => m.id === "everest");
  const plan = createMockItinerary({ ...input, objective: "summit" }, mountain, [], 60);
  plan.itinerary.phases[0].routeDetails = {
    difficulty: "Icefall crevasses and unstable ice.",
    altitudeChanges: [
      { from: "Base Camp", to: "Camp 1", fromMeters: 5364, toMeters: 5943 },
      { from: "Camp 1", to: "Base Camp", fromMeters: 5943, toMeters: 5364 },
    ],
  };
  const markdown = buildItineraryMarkdown({ plan, input, summit: mountain, equipment: plan.itinerary.equipment });
  assert.match(markdown, /\*\*Difficulty:\*\* Icefall crevasses/);
  assert.match(markdown, /\+579 m/);
  assert.match(markdown, /−579 m/);
});


test("climbing equipment excludes packing supplies even when notes mention technical gear", () => {
  const gear = filterClimbingEquipment({
    mustHave: ["Crampons — fit to boots", "Mountaineering ice axe", "Climbing harness", "Waterproof jacket — room for a harness", "Headlamp — attach to your helmet", "Sunscreen", "Sleeping bag", "Food", "Insulated gloves"],
    importantToHave: ["Hiking poles", "Locking carabiners", "Dry bags — protect crampons"],
    niceToHave: ["Camera"],
  });
  assert.deepEqual(gear.mustHave, ["Crampons — fit to boots", "Mountaineering ice axe", "Climbing harness"]);
  assert.deepEqual(gear.importantToHave, ["Hiking poles", "Locking carabiners"]);
  assert.deepEqual(gear.niceToHave, []);
});

test("equivalent climbing gear is listed once at its highest priority", () => {
  const gear = filterClimbingEquipment({
    mustHave: ["Crampons — steel", "Mountaineering ice axe"],
    importantToHave: ["12-point crampons", "Ice axe", "Trekking poles"],
    niceToHave: ["Hiking poles"],
  });
  assert.equal(gear.mustHave.length, 2);
  assert.deepEqual(gear.importantToHave, ["Trekking poles"]);
  assert.deepEqual(gear.niceToHave, []);
});

test("climbing-only views preserve the route distinction across every mountain", () => {
  for (const mountain of catalog) {
    const trek = mergeEquipmentReference(getEquipmentReference(mountain, "trek"), { mustHave: [], importantToHave: [], niceToHave: [] });
    assert.deepEqual(trek.mustHave, []);
    assert.ok(trek.importantToHave.some(item => /poles/i.test(item)));
    assert.ok(!JSON.stringify(trek).includes("Crampons"));
    const summit = mergeEquipmentReference(getEquipmentReference(mountain, "summit"), { mustHave: [], importantToHave: [], niceToHave: [] });
    assert.doesNotMatch(JSON.stringify(summit), /Waterproof jacket|First-aid|Spare socks|Sun protection/);
  }
});

test("partial elevations keep known heights without an invented change or repeated warning", async () => {
  const { formatAltitudeChange, getElevationDataNote } = await import("../app/lib/trip-planner/stage-route-details.ts");
  const movement = { from: "Trailhead", to: "Summit", fromMeters: null, toMeters: 3776 };
  const formatted = formatAltitudeChange(movement);
  assert.equal(formatted.change, null);
  assert.match(formatted.route, /Summit \(3,776 m/);
  assert.doesNotMatch(formatted.route, /unverified|unavailable/i);
  assert.match(getElevationDataNote([{ routeDetails: { difficulty: "Volcanic footing", altitudeChanges: [movement] } }]), /both endpoints/i);
  assert.equal(getElevationDataNote([]), null);
  assert.equal(getElevationDataNote([{ routeDetails: { difficulty: "Rest", altitudeChanges: [{ ...movement, fromMeters: 3776 }] } }]), null);
});

test("exports explain missing elevation data once instead of repeating it per stage", () => {
  const mountain = catalog.find(m => m.id === "mount-fuji");
  const plan = createMockItinerary({ ...input, objective: "summit" }, mountain, [], 3);
  for (const day of plan.itinerary.days) {
    day.routeDetails = { difficulty: "Route details to confirm", altitudeChanges: [
      { from: "Stage start", to: "Stage end", fromMeters: null, toMeters: null },
    ] };
  }
  const markdown = buildItineraryMarkdown({ plan, input, summit: mountain, equipment: plan.itinerary.equipment });
  assert.equal((markdown.match(/Elevation data is unavailable for this route/g) ?? []).length, 1);
  assert.doesNotMatch(markdown, /Change unverified|elevation unverified|Route elevations unverified|\*\*Altitude changes\*\*/);
  assert.equal((markdown.match(/\*\*Difficulty:\*\*/g) ?? []).length, 3);
});

test("stage equipment exports preserve daily and phase requirements and missing legacy data", () => {
  const mountain = catalog.find(m => m.id === "mount-fuji");
  for (const duration of [3, 30]) {
    const plan = createMockItinerary({ ...input, objective: "summit" }, mountain, [], duration);
    const stages = plan.itinerary.phases.length ? plan.itinerary.phases : plan.itinerary.days;
    stages[0].requiredEquipment = ["Crampons — only if confirmed conditions require them"];
    stages[1].requiredEquipment = [];
    delete stages[2].requiredEquipment;
    const parsed = tripPlanSchema.parse(plan);
    assert.equal((parsed.itinerary.phases.length ? parsed.itinerary.phases : parsed.itinerary.days)[2].requiredEquipment, null);
    const markdown = buildItineraryMarkdown({ plan: parsed, input, summit: mountain, equipment: parsed.itinerary.equipment });
    assert.match(markdown, /\*\*Required equipment:\*\* Crampons — only if confirmed conditions require them/);
    assert.match(markdown, /\*\*Required equipment:\*\* No climbing equipment required for this stage/);
    assert.match(markdown, /\*\*Required equipment:\*\* Not specified in this draft/);
  }
});
