import assert from "node:assert/strict";
import test from "node:test";
import {
  tripDates,
  tripInputSchema,
  tripPlanSchema,
} from "../app/lib/trip-planner/schema.ts";

const year = new Date().getUTCFullYear() + 1;
const input = {
  mountainId: "table-mountain",
  origin: "London, UK",
  departureDate: `${year}-05-01`,
  returnDate: `${year}-05-05`,
  travelers: 2,
  objective: "visit",
  experience: "beginner",
  currency: "GBP",
  budget: { kind: "unknown" },
};

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

test("date windows are inclusive and independent of daylight saving", () => {
  assert.equal(tripDates(`${year}-03-12`, `${year}-03-16`).length, 5);
  assert.deepEqual(tripDates(`${year}-05-01`, `${year}-05-01`), [
    `${year}-05-01`,
  ]);
  assert.equal(tripDates(`${year}-05-01`, `${year}-05-21`).length, 21);
  assert.deepEqual(tripDates(`${year}-05-01`, `${year}-05-22`), []);
  assert.deepEqual(tripDates(`${year}-05-05`, `${year}-05-01`), []);
});

test("rejects impossible or past dates and malformed trip parameters", () => {
  for (const changes of [
    { departureDate: `${year}-02-30` },
    { departureDate: "2000-01-01", returnDate: "2000-01-05" },
    { returnDate: `${year}-04-30` },
    { returnDate: `${year}-05-22` },
    { travelers: 0 },
    { travelers: 1.5 },
    { travelers: 13 },
    { origin: "  " },
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
      budgetNote: "Budget unknown.",
      assumptions: [],
      equipment: [],
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
