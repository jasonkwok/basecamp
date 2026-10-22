import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { applyRecommendationSafety } from "../app/lib/mountain-guide/recommendation-policy.ts";
import { allowAiRequest } from "../app/lib/ai/rate-limit-core.ts";
import { buildMountainRecommendationsMarkdown } from "../app/components/map-explorer/mountain-guide/mountain-recommendations-markdown.ts";

const mountains = JSON.parse(
  readFileSync(new URL("../app/data/mountains.json", import.meta.url), "utf8"),
).mountains;
const expertMountain = mountains.find(
  (mountain) => mountain.difficulty.level === "expert",
);

test("replaces an extreme summit recommendation with three beginner progressions", () => {
  const result = applyRecommendationSafety(
    {
      reply: "Everest is a great match.",
      recommendations: [
        { mountainId: "everest", objective: "summit", reason: "High altitude." },
      ],
    },
    "beginner",
    mountains,
  );

  assert.equal(result.recommendations.length, 3);
  assert.ok(
    result.recommendations.every(({ mountainId }) => mountainId !== "everest"),
  );
  assert.ok(
    result.recommendations.every(({ mountainId }) => {
      const mountain = mountains.find((entry) => entry.id === mountainId);
      return ["beginner", "intermediate"].includes(mountain.difficulty.level);
    }),
  );
  assert.match(result.reply, /don’t attempt it yet/i);
  assert.match(result.reply, /qualified guide to assess readiness/i);
  assert.doesNotMatch(result.reply, /what technical climbing have you done/i);
});

test("keeps suitable options while removing an unsuitable summit", () => {
  const result = applyRecommendationSafety(
    {
      reply: "Everest is a great match.",
      recommendations: [
        { mountainId: "everest", objective: "summit", reason: "Extreme altitude." },
        { mountainId: "mount-fuji", objective: "summit", reason: "A marked route." },
      ],
    },
    "beginner",
    mountains,
  );

  assert.equal(result.recommendations.length, 3);
  assert.ok(result.recommendations.some(({ mountainId }) => mountainId === "mount-fuji"));
  assert.ok(
    result.recommendations.every(({ mountainId }) => mountainId !== "everest"),
  );
  assert.match(result.reply, /progressive objectives matched to your current level/i);
  assert.doesNotMatch(result.reply, /Everest/i);
});

test("allows a lower-risk trek on a mountain whose summit is unsuitable", () => {
  const result = applyRecommendationSafety(
    {
      reply: "Try the Everest Base Camp trek.",
      recommendations: [
        {
          mountainId: "everest",
          objective: "trek",
          reason: "A non-summit high-altitude trek.",
        },
      ],
    },
    "beginner",
    mountains,
  );

  assert.equal(result.recommendations.length, 1);
});

test("replaces technical expert summits with level-appropriate progressions", () => {
  assert.ok(expertMountain, "catalog includes an expert-rated ascent");

  const result = applyRecommendationSafety(
    {
      reply: "A technical summit could be a fit.",
      recommendations: [
        {
          mountainId: expertMountain.id,
          objective: "summit",
          reason: "A technical route.",
        },
      ],
    },
    "high-altitude-summits",
    mountains,
  );

  assert.equal(result.recommendations.length, 3);
  assert.ok(
    result.recommendations.every(({ mountainId }) => {
      const mountain = mountains.find((entry) => entry.id === mountainId);
      return mountain.difficulty.level !== "expert" &&
        mountain.difficulty.level !== "extreme";
    }),
  );
});

test("deduplicates recommendations and replaces over-level summit options", () => {
  const recommendations = [
    { mountainId: "mount-washington", objective: "summit", reason: "Nearby." },
    { mountainId: "mount-washington", objective: "trek", reason: "Another option." },
  ];
  const result = applyRecommendationSafety(
    { reply: "Mount Washington fits your priorities.", recommendations },
    "regular",
    mountains,
  );

  assert.equal(result.recommendations.length, 3);
  assert.deepEqual(result.recommendations[0], recommendations[1]);
  assert.equal(
    new Set(result.recommendations.map(({ mountainId }) => mountainId)).size,
    3,
  );
  assert.ok(
    !result.recommendations.some(
      ({ mountainId, objective }) =>
        mountainId === "mount-washington" && objective === "summit",
    ),
  );
});

test("keeps an empty recommendation list so the guide can ask a follow-up", () => {
  const result = applyRecommendationSafety(
    {
      reply: "How many days do you have, and are you looking to summit or trek?",
      recommendations: [],
    },
    "regular",
    mountains,
  );

  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /how many days/i);
});

test("returns summit options when the selected experience and objective are clear", () => {
  const result = applyRecommendationSafety(
    {
      reply: "What technical climbing have you done on snow or glaciers?",
      recommendations: [],
    },
    "beginner",
    mountains,
    "To summit, no other real priorities.\nNo experience yet.",
    ["mount-fuji"],
  );

  assert.equal(result.recommendations.length, 3);
  assert.match(result.reply, /selected experience and summit goal/i);
  assert.doesNotMatch(result.reply, /what technical climbing/i);
  assert.ok(
    result.recommendations.every(({ mountainId }) => {
      const mountain = mountains.find((entry) => entry.id === mountainId);
      return ["beginner", "intermediate"].includes(mountain.difficulty.level);
    }),
  );
  assert.ok(
    result.recommendations.every(({ mountainId }) => mountainId !== "mount-fuji"),
  );
});

test("offers fresh options when the traveler asks for more", () => {
  const previousOptions = mountains
    .filter((mountain) => ["beginner", "intermediate"].includes(mountain.difficulty.level))
    .slice(0, 3)
    .map(({ id }) => id);
  const result = applyRecommendationSafety(
    {
      reply: "Here are those options again.",
      recommendations: previousOptions.map((mountainId) => ({
        mountainId,
        objective: "summit",
        reason: "A suitable climb.",
      })),
    },
    "beginner",
    mountains,
    "I want to summit.",
    [],
    "Give me more options.",
    previousOptions,
  );

  assert.equal(result.recommendations.length, 3);
  assert.ok(
    result.recommendations.every(
      ({ mountainId }) => !previousOptions.includes(mountainId),
    ),
  );
  assert.match(result.reply, /fresh summit options/i);
});

test("explains when no new suitable options remain", () => {
  const availableMountains = mountains
    .filter((mountain) => ["beginner", "intermediate"].includes(mountain.difficulty.level))
    .slice(0, 3);
  const alreadyShown = availableMountains.map(({ id }) => id);
  const result = applyRecommendationSafety(
    {
      reply: "Here are more options.",
      recommendations: alreadyShown.map((mountainId) => ({
        mountainId,
        objective: "summit",
        reason: "A suitable climb.",
      })),
    },
    "beginner",
    availableMountains,
    "I want to summit.",
    [],
    "Give me more options.",
    alreadyShown,
  );

  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /run out of unshown summit options/i);
});

test("offers new options for a trek follow-up too", () => {
  const previousOptions = mountains.slice(0, 3).map(({ id }) => id);
  const result = applyRecommendationSafety(
    {
      reply: "Here are those treks again.",
      recommendations: previousOptions.map((mountainId) => ({
        mountainId,
        objective: "trek",
        reason: "A suitable trek.",
      })),
    },
    "regular",
    mountains,
    "I want a trek.",
    [],
    "Give me more options.",
    previousOptions,
  );

  assert.equal(result.recommendations.length, 3);
  assert.ok(
    result.recommendations.every(
      ({ mountainId, objective }) =>
        !previousOptions.includes(mountainId) && objective === "trek",
    ),
  );
  assert.ok(
    result.recommendations.every(({ reason }) => !/ascent|summit/i.test(reason)),
  );
});

test("uses visit language when filling a location follow-up", () => {
  const priorVisits = mountains
    .filter((mountain) => mountain.region === "Asia")
    .slice(0, 3)
    .map(({ id }) => id);
  const result = applyRecommendationSafety(
    {
      reply: "Here are the same visits again.",
      recommendations: priorVisits.map((mountainId) => ({
        mountainId,
        objective: "visit",
        reason: "A suitable visit.",
      })),
    },
    "regular",
    mountains,
    "I’d like to visit a mountain destination.\nWhat about elsewhere in Asia?",
    [],
    "What about elsewhere in Asia?",
    priorVisits,
  );

  assert.ok(result.recommendations.length > 0);
  assert.ok(
    result.recommendations.every(({ mountainId, objective, reason }) => {
      const mountain = mountains.find((entry) => entry.id === mountainId);
      return (
        mountain.region === "Asia" &&
        !priorVisits.includes(mountainId) &&
        objective === "visit" &&
        !/ascent|summit/i.test(reason)
      );
    }),
  );
});

test("keeps a trek objective when the model returns no cards on a more-options turn", () => {
  const previousOptions = mountains.slice(0, 3).map(({ id }) => ({
    mountainId: id,
    objective: "trek",
    reason: "A suitable trekking option.",
  }));
  const result = applyRecommendationSafety(
    {
      reply: "Here are some other treks.",
      recommendations: [],
    },
    "regular",
    mountains,
    "I want a trek.",
    [],
    "Give me more options.",
    previousOptions.map(({ mountainId }) => mountainId),
    previousOptions,
  );

  assert.equal(result.recommendations.length, 3);
  assert.ok(
    result.recommendations.every(
      ({ mountainId, objective, reason }) =>
        !previousOptions.some((option) => option.mountainId === mountainId) &&
        objective === "trek" &&
        !/ascent|summit/i.test(reason),
    ),
  );
});

test("preserves a clarification when the objective is still unknown", () => {
  const result = applyRecommendationSafety(
    {
      reply: "Are you looking to summit, trek, or visit?",
      recommendations: [],
    },
    "regular",
    mountains,
    "I have no specific objective yet.",
    [],
    "What about anything in North America?",
  );

  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /summit, trek, or visit/i);
});

test("keeps recommendations inside the requested country", () => {
  for (const country of ["Nepal", "Japan"]) {
    const result = applyRecommendationSafety(
      {
        reply: "Here are some mountains to climb.",
        recommendations: [
          { mountainId: "mount-fuji", objective: "summit", reason: "A mountain." },
          { mountainId: "kilimanjaro", objective: "summit", reason: "A mountain." },
          { mountainId: "mont-blanc", objective: "summit", reason: "A mountain." },
        ],
      },
      "expert",
      mountains,
      `I want to climb in ${country}.`,
    );

    assert.ok(result.recommendations.length > 0, `${country} has catalog options`);
    assert.doesNotMatch(result.reply, /exceeds the experience/i);
    assert.ok(
      result.recommendations.every(({ mountainId }) => {
        const mountain = mountains.find((entry) => entry.id === mountainId);
        return mountain.location.toLowerCase().includes(country.toLowerCase());
      }),
      `all recommendations should be located in ${country}`,
    );
  }
});

test("a later region request replaces the earlier region and avoids old options", () => {
  const northAmericanOptions = mountains
    .filter((mountain) => mountain.region === "North America")
    .slice(0, 3);
  const alreadyShownIds = northAmericanOptions.map(({ id }) => id);
  const result = applyRecommendationSafety(
    {
      reply: "Here are the North American options again.",
      recommendations: alreadyShownIds.map((mountainId) => ({
        mountainId,
        objective: "summit",
        reason: "A suitable summit.",
      })),
    },
    "expert",
    mountains,
    "I want to summit.\nWhat about anything in North America?\nWhat in South America?",
    [],
    "What in South America?",
    alreadyShownIds,
  );

  assert.equal(result.recommendations.length, 3);
  assert.match(result.reply, /South America/i);
  assert.ok(
    result.recommendations.every(({ mountainId }) => {
      const mountain = mountains.find((entry) => entry.id === mountainId);
      return mountain.region === "South America" && !alreadyShownIds.includes(mountainId);
    }),
  );
});

test("does not invent safe local summits when a requested region has none", () => {
  const difficultNepalSummits = mountains.filter(
    (mountain) =>
      mountain.location.includes("Nepal") &&
      !["beginner", "intermediate"].includes(mountain.difficulty.level),
  );
  const result = applyRecommendationSafety(
    {
      reply: "You could try Everest.",
      recommendations: [
        { mountainId: "everest", objective: "summit", reason: "High altitude." },
      ],
    },
    "beginner",
    difficultNepalSummits,
    "I want to summit in Nepal.",
  );

  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /strongly advise against attempting/i);
  assert.match(result.reply, /Nepal/i);
});

test("respects a later change from summit to trek", () => {
  const result = applyRecommendationSafety(
    {
      reply: "How much time do you have for a trek?",
      recommendations: [],
    },
    "beginner",
    mountains,
    "I want to summit.\nActually, I’d rather trek.",
  );

  assert.deepEqual(result.recommendations, []);
  assert.match(result.reply, /how much time/i);
});

test("AI feature limits are isolated and capped at 50 requests per hour", () => {
  const identity = `mountain-guide-test-${crypto.randomUUID()}`;

  for (let request = 0; request < 50; request += 1) {
    assert.equal(allowAiRequest(identity, "mountain-guide"), true);
  }

  assert.equal(allowAiRequest(identity, "mountain-guide"), false);
  assert.equal(allowAiRequest(identity, "trip-plan"), true);
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
