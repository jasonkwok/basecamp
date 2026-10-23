import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getLatestLocationPreference } from "../app/lib/mountain-guide/latest-preferences.ts";
import { recoverMountainRecommendations } from "../app/lib/mountain-guide/recover-recommendations.ts";
import { applyRecommendationSafety } from "../app/lib/mountain-guide/recommendation-policy.ts";
import { allowAiRequest } from "../app/lib/ai/rate-limit-core.ts";
import { buildMountainRecommendationsMarkdown } from "../app/components/map-explorer/mountain-guide/mountain-recommendations-markdown.ts";

const mountains = JSON.parse(
  readFileSync(new URL("../app/data/mountains.json", import.meta.url), "utf8"),
).mountains;
const option = (mountainId, rating = "strong", objective = "summit") => ({
  mountainId, rating, objective, reason: "Builds experience toward your goal.",
});

const preferences = (overrides = {}) => ({
  goal: "Everest someday", locations: [], minAltitudeMeters: null,
  maxAltitudeMeters: null, maxTripDays: null, skills: [], budget: null,
  firmRequirements: [], relaxedPreferences: [], ...overrides,
});
const evaluate = (recommendations, prefs = {}, experience = "beginner", message = "", previous = []) =>
  applyRecommendationSafety({ intent: "recommendations", unmatchedPreferences: [], reply: "These fit your goal.", preferences: preferences(prefs), recommendations },
    experience, mountains, message, previous);

test("preserves discovery and a goal without forcing recommendations", () => {
  const output = { intent: "discovery", unmatchedPreferences: [], reply: "What skills would you like to develop?", preferences: preferences(), recommendations: [] };
  assert.deepEqual(applyRecommendationSafety(output, "beginner", mountains), output);
});

test("removes unsuitable summits without inventing generic alternatives", () => {
  const result = evaluate([option("everest")]);
  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /exceed your selected experience/i);
  assert.doesNotMatch(result.reply, /region|change your experience/i);
});

test("keeps a single suitable match and its goal-specific reason", () => {
  const recommendation = option("mount-fuji");
  assert.deepEqual(evaluate([recommendation]).recommendations, [recommendation]);
});

test("removes an unsuitable summit while keeping a suitable match", () => {
  const result = evaluate([option("everest"), option("mount-fuji")]);
  assert.deepEqual(result.recommendations.map(x => x.mountainId), ["mount-fuji"]);
});

test("ranks by match and caps results at five", () => {
  const ratings = ["low", "strong", "medium", "very strong", "strong", "medium"];
  const result = evaluate(mountains.slice(0, 6).map((m, i) => option(m.id, ratings[i], "visit")), {}, "expert");
  assert.equal(result.recommendations.length, 5);
  assert.deepEqual(result.recommendations.map(x => x.rating), ["very strong", "strong", "strong", "medium", "medium"]);
});

test("deduplicates options", () => {
  assert.equal(evaluate([option("mount-fuji"), option("mount-fuji")]).recommendations.length, 1);
});

test("removes repeats when asking for more without inventing alternatives", () => {
  const result = evaluate([option("mount-fuji")], {}, "beginner", "More options", ["mount-fuji"]);
  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /already been shown/i);
});

test("a soft location preference reduces rating rather than removing a useful option", () => {
  const result = evaluate([option("mount-fuji", "very strong")], { locations: ["Nepal"] });
  assert.equal(result.recommendations[0].rating, "medium");
  assert.match(result.recommendations[0].reason, /preferred location/i);
});

test("firm requirements block mismatches and identify the actual constraint", () => {
  const result = evaluate([option("mount-fuji")], { locations: ["Nepal"], firmRequirements: ["location"] });
  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /firm location/i);
});

test("a worldwide preference no longer inherits a historical region", () => {
  const result = evaluate([option("mount-fuji")], { locations: [], relaxedPreferences: ["location"] });
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].rating, "strong");
});

test("relaxed requirements cannot remain firm even if extraction contains both", () => {
  const result = evaluate([option("mount-fuji")], {
    locations: ["Nepal"], firmRequirements: ["location"], relaxedPreferences: ["location"],
  });
  assert.equal(result.recommendations.length, 1);
});

test("multiple soft compromises reduce rating to low", () => {
  const result = evaluate([option("mount-fuji", "very strong")], { locations: ["Nepal"], minAltitudeMeters: 6000 });
  assert.equal(result.recommendations[0].rating, "low");
  assert.match(result.recommendations[0].reason, /location and altitude/i);
});

test("remaining firm altitude requirement is identified after location is relaxed", () => {
  const result = evaluate([option("mount-fuji")], {
    minAltitudeMeters: 6000, firmRequirements: ["altitude"], relaxedPreferences: ["location"],
  });
  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /altitude/i);
  assert.doesNotMatch(result.reply, /region|location/i);
});

test("trip duration is a tradeoff unless explicitly required", () => {
  const soft = evaluate([option("mount-fuji")], { maxTripDays: 0.5 });
  assert.equal(soft.recommendations[0].rating, "medium");
  const firm = evaluate([option("mount-fuji")], { maxTripDays: 0.5, firmRequirements: ["duration"] });
  assert.deepEqual(firm.recommendations, []);
  assert.match(firm.reply, /duration/i);
});

test("trek altitude and duration are not inferred from summit data", () => {
  const result = evaluate([option("everest", "medium", "trek")], {
    maxAltitudeMeters: 6000, maxTripDays: 20, firmRequirements: ["altitude", "duration"],
  }, "regular");
  assert.equal(result.recommendations.length, 1);
});

const recover = (overrides = {}) => recoverMountainRecommendations({
  output: { intent: "recommendations", unmatchedPreferences: [], reply: "Try Everest.", preferences: preferences(), recommendations: [option("everest")] },
  experience: "beginner", mountains, latestUserMessage: "Find my next climb.",
  previouslyRecommendedMountainIds: [], summitedMountainIds: [],
  regenerate: async (candidates) => ({
    intent: "recommendations", unmatchedPreferences: [], reply: "These build experience for your longer-term goal.", preferences: preferences(),
    recommendations: candidates.slice(0, 2).map(c => ({ ...c, rating: "strong" })),
  }),
  ...overrides,
});

test("rejected ambitions trigger a rematch with eligible next climbs", async () => {
  let calls = 0;
  const result = await recover({
    summitedMountainIds: ["mount-fuji"], previouslyRecommendedMountainIds: ["kilimanjaro"],
    regenerate: async (candidates) => {
      calls++;
      assert.ok(candidates.length > 0);
      assert.ok(candidates.every(c => !["everest", "mount-fuji"].includes(c.mountainId)));
      assert.ok(candidates.every(c => mountains.find(m => m.id === c.mountainId).kind === "mountain"));
      assert.ok(candidates.every(c => ["beginner", "intermediate"].includes(
        mountains.find(m => m.id === c.mountainId).difficulty.level,
      )));
      return { preferences: preferences(), intent: "recommendations", unmatchedPreferences: [], reply: "A next step toward your goal.", recommendations: candidates.slice(0, 2) };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.recommendations.length, 2);
  assert.doesNotMatch(result.reply, /exceed your selected experience/i);
});

test("failed rematch still returns checked, less demanding catalog climbs", async () => {
  const result = await recover({ regenerate: async () => { throw new Error("Unavailable"); } });
  assert.ok(result.recommendations.length > 0 && result.recommendations.length <= 5);
  assert.ok(result.recommendations.every(c => c.mountainId !== "everest"));
  assert.match(result.reply, /less demanding climbs/i);
});

test("recovery fallback retains tradeoff ratings without duplicating explanations", async () => {
  const result = await recover({
    output: { intent: "recommendations", unmatchedPreferences: [], reply: "Try Everest.", preferences: preferences({ locations: ["Nepal"], minAltitudeMeters: 8000 }), recommendations: [option("everest")] },
    regenerate: async () => { throw new Error("Unavailable"); },
  });
  assert.ok(result.recommendations.length > 0);
  for (const recommendation of result.recommendations) {
    assert.ok(["medium", "low"].includes(recommendation.rating));
    assert.equal((recommendation.reason.match(/Outside your preferred/g) ?? []).length, 1);
  }
});

test("rematch cannot change firm preferences or reintroduce a blocked summit", async () => {
  const result = await recover({
    output: { intent: "recommendations", unmatchedPreferences: [], reply: "Try Everest.", preferences: preferences({ locations: ["Japan"], firmRequirements: ["location"] }), recommendations: [option("everest")] },
    regenerate: async () => ({ preferences: preferences(), intent: "recommendations", unmatchedPreferences: [], reply: "Try Everest again.", recommendations: [option("everest")] }),
  });
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(c => mountains.find(m => m.id === c.mountainId).location.includes("Japan")));
  assert.deepEqual(result.preferences.firmRequirements, ["location"]);
});

test("recovery identifies firm altitude as the blocker when no easier climb fits", async () => {
  let called = false;
  const result = await recover({
    output: { intent: "recommendations", unmatchedPreferences: [], reply: "Try Everest.", preferences: preferences({ minAltitudeMeters: 8000, firmRequirements: ["altitude"] }), recommendations: [option("everest")] },
    regenerate: async () => { called = true; throw new Error("Must not call"); },
  });
  assert.equal(called, false);
  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /firm altitude/i);
});

test("discovery and genuine zero-match turns do not force a rematch", async () => {
  let called = false;
  const output = { preferences: preferences(), intent: "discovery", unmatchedPreferences: [], reply: "What skills interest you?", recommendations: [] };
  const result = await recover({ output, regenerate: async () => { called = true; throw new Error("Must not call"); } });
  assert.equal(called, false);
  assert.deepEqual(result, output);
});

test("rematch may explain a genuine goal-fit gap without forced options", async () => {
  const result = await recover({
    output: { preferences: preferences({ skills: ["ice climbing"] }), intent: "recommendations", unmatchedPreferences: [], reply: "Try Everest.", recommendations: [option("everest")] },
    regenerate: async () => ({
      preferences: preferences(), intent: "recommendations", unmatchedPreferences: ["skills"], reply: "This catalog does not establish ice-climbing instruction on these routes.", recommendations: [],
    }),
  });
  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /ice-climbing instruction/i);
});

test("direct location refinements replace the location dimension", () => {
  for (const message of ["any ones in nepal?", "What about Nepal?", "In Nepal", "Nepal?"]) {
    assert.deepEqual(getLatestLocationPreference(message, mountains), ["Nepal"]);
  }
  assert.deepEqual(getLatestLocationPreference("Anywhere in the world", mountains), []);
  assert.equal(getLatestLocationPreference("I have two weeks", mountains), undefined);
  assert.equal(getLatestLocationPreference("My dream is Everest in Nepal someday", mountains), undefined);
});

test("Nepal follow-up replaces a stale country and immediately searches again", async () => {
  const initial = preferences({ locations: ["Japan"], firmRequirements: ["location"], maxTripDays: 30, skills: ["glacier travel"] });
  const result = await recover({
    experience: "technical", latestUserMessage: "any ones in nepal?",
    previouslyRecommendedMountainIds: ["mount-fuji", "island-peak"],
    output: { intent: "recommendations", unmatchedPreferences: [], reply: "Try Fuji again.", preferences: initial, recommendations: [option("mount-fuji")] },
    regenerate: async (candidates, active) => {
      assert.deepEqual(active.locations, ["Nepal"]);
      assert.equal(active.maxTripDays, 30);
      assert.deepEqual(active.skills, ["glacier travel"]);
      assert.ok(candidates.every(c => mountains.find(m => m.id === c.mountainId).location.includes("Nepal")));
      assert.ok(candidates.some(c => c.mountainId === "island-peak"));
      return { preferences: active, intent: "recommendations", unmatchedPreferences: [], reply: "Here are options in Nepal.", recommendations: candidates.slice(0, 2) };
    },
  });
  assert.ok(result.recommendations.length > 0);
  assert.deepEqual(result.preferences.locations, ["Nepal"]);
  assert.doesNotMatch(result.reply, /relax/i);
});

test("a location refinement recovers even from an empty stale rejection", async () => {
  const result = await recover({
    experience: "technical", latestUserMessage: "any ones in nepal?",
    previouslyRecommendedMountainIds: ["mount-fuji"],
    output: { intent: "recommendations", unmatchedPreferences: [], reply: "Which location requirement would you relax?", preferences: preferences({ locations: ["Japan"] }), recommendations: [] },
  });
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(c => mountains.find(m => m.id === c.mountainId).location.includes("Nepal")));
});

test("an initial location answer preserves discovery before any options are shown", async () => {
  let called = false;
  const result = await recover({
    latestUserMessage: "In Nepal", previouslyRecommendedMountainIds: [],
    output: { intent: "discovery", unmatchedPreferences: [], reply: "What are you working toward?", preferences: preferences(), recommendations: [] },
    regenerate: async () => { called = true; throw new Error("Must not call"); },
  });
  assert.equal(called, false);
  assert.deepEqual(result.recommendations, []);
  assert.equal(result.reply, "What are you working toward?");
});

test("no eligible Nepal summit offers clearly labeled named trekking alternatives", async () => {
  const result = await recover({
    latestUserMessage: "any ones in nepal?", previouslyRecommendedMountainIds: ["mount-fuji"],
    output: { intent: "recommendations", unmatchedPreferences: [], reply: "Try Fuji.", preferences: preferences({ locations: ["Japan"] }), recommendations: [option("mount-fuji")] },
  });
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(c => c.objective === "trek" &&
    mountains.find(m => m.id === c.mountainId).location.includes("Nepal")));
  assert.doesNotMatch(result.reply, /firm location|Japan|exceed your selected experience/i);
});

const difficultyWarning = "These objectives exceed your selected experience. A less demanding climb or guided training may be a better next step.";

test("the exact empty difficulty warning triggers recovery instead of bypassing it", async () => {
  const result = await recover({
    output: { preferences: preferences(), intent: "recommendations", unmatchedPreferences: [], reply: difficultyWarning, recommendations: [] },
  });
  assert.ok(result.recommendations.length > 0);
  assert.notEqual(result.reply, difficultyWarning);
});

test("an empty difficulty warning from the retry falls back to checked cards", async () => {
  const result = await recover({ regenerate: async () => ({
    preferences: preferences(), intent: "recommendations", unmatchedPreferences: [], reply: difficultyWarning, recommendations: [],
  }) });
  assert.ok(result.recommendations.length > 0);
  assert.notEqual(result.reply, difficultyWarning);
});

test("recovery can reuse previously shown suitable climbs unless new options are requested", async () => {
  const completed = mountains.filter(m => m.kind === "mountain" && ["beginner", "intermediate"].includes(m.difficulty.level)).map(m => m.id);
  const result = await recover({ previouslyRecommendedMountainIds: completed });
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(c => completed.includes(c.mountainId)));
});


test("initial valid suggestions exclude summited mountains for every objective", () => {
  for (const objective of ["summit", "trek", "visit"]) {
    const result = applyRecommendationSafety({
      intent: "recommendations", unmatchedPreferences: [], preferences: preferences(),
      reply: "Mount Fuji is a fit.", recommendations: [option("mount-fuji", "strong", objective), option("kilimanjaro", "medium", objective)],
    }, "expert", mountains, "", [], ["mount-fuji"]);
    assert.deepEqual(result.recommendations.map(c => c.mountainId), ["kilimanjaro"]);
    assert.doesNotMatch(result.reply, /Mount Fuji/);
  }
});

test("a completed initial recommendation triggers fresh matches", async () => {
  let called = false;
  const result = await recover({
    output: { intent: "recommendations", unmatchedPreferences: [], preferences: preferences(), reply: "Try Fuji.", recommendations: [option("mount-fuji")] },
    summitedMountainIds: ["mount-fuji"],
    regenerate: async (candidates, active) => {
      called = true;
      assert.ok(candidates.every(c => c.mountainId !== "mount-fuji"));
      return { intent: "recommendations", unmatchedPreferences: [], preferences: active, reply: "A new next step.", recommendations: candidates.slice(0, 2) };
    },
  });
  assert.equal(called, true);
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(c => c.mountainId !== "mount-fuji"));
});

test("a retry cannot reintroduce a completed mountain and fallback stays uncompleted", async () => {
  const result = await recover({
    summitedMountainIds: ["mount-fuji"],
    regenerate: async () => ({ intent: "recommendations", unmatchedPreferences: [], preferences: preferences(), reply: "Try Fuji.", recommendations: [option("mount-fuji")] }),
  });
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(c => c.mountainId !== "mount-fuji"));
});

test("when the entire catalog is completed, no completed objective is returned", async () => {
  let called = false;
  const result = await recover({
    summitedMountainIds: mountains.map(m => m.id),
    regenerate: async () => { called = true; throw new Error("No candidates should remain"); },
  });
  assert.deepEqual(result.recommendations, []);
  assert.equal(called, false);
  assert.match(result.reply, /completed/i);
});

test("guide allows 100 replies per hour while trip drafts retain their separate limit", () => {
  const identity = `mountain-guide-test-${crypto.randomUUID()}`;

  for (let request = 0; request < 100; request += 1) {
    assert.equal(allowAiRequest(identity, "mountain-guide"), true);
  }

  assert.equal(allowAiRequest(identity, "mountain-guide"), false);
  for (let request = 0; request < 50; request += 1) {
    assert.equal(allowAiRequest(identity, "trip-plan"), true);
  }
  assert.equal(allowAiRequest(identity, "trip-plan"), false);
});

test("recommendation export preserves all options and useful mountain details", () => {
  const options = ["Mount Fuji", "Ben Nevis", "Table Mountain"].map((name) => ({
    name,
    objective: "trek",
    location: "Japan · Asia",
    elevationMeters: 3776,
    difficulty: "Intermediate",
    ascent: "Yoshida Trail",
    tripLength: "2–3 days",
    budget: "$300–$900 USD",
    budgetBasis: "Multi-day trekking allowance",
    budgetSource: "https://example.com/mountain",
    description: "A scenic route.",
    rating: "very strong",
    reason: "Matches the requested challenge.",
  }));

  const markdown = buildMountainRecommendationsMarkdown({
    experience: "Regular hiker",
    options,
  });

  assert.match(markdown, /## 1\. Mount Fuji · Trek/);
  assert.match(markdown, /## 2\. Ben Nevis · Trek/);
  assert.match(markdown, /## 3\. Table Mountain · Trek/);
  assert.match(markdown, /Estimated budget:.*per person/);
  assert.match(markdown, /Why it may fit/);
  assert.match(markdown, /Match:\*\* very strong/);
});

test("recommendation export keeps generated reasons on a single line", () => {
  const markdown = buildMountainRecommendationsMarkdown({
    experience: "Regular hiker",
    options: [
      {
        name: "Mount Fuji",
        objective: "trek",
        location: "Japan",
        elevationMeters: 3776,
        difficulty: "Intermediate",
        ascent: "Yoshida Trail",
        tripLength: "2–3 days",
        budget: "$300–$900 USD",
        budgetBasis: "Comparable trips",
        budgetSource: "https://example.com/mountain",
        description: "A scenic route.",
        reason: "Good fit.\n\n# Injected heading",
      },
    ],
  });

  assert.doesNotMatch(markdown, /\n# Injected heading/);
});
