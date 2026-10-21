import assert from "node:assert/strict";
import test from "node:test";
import { MOUNTAIN_RANGES } from "../app/data/mountain-ranges.ts";

test("global map shows the seven requested mountain ranges", () => {
  assert.deepEqual(
    MOUNTAIN_RANGES.map((range) => range.name),
    [
      "Himalayas",
      "Andes",
      "Alps",
      "Rocky Mountains",
      "East African Highlands",
      "Karakoram",
      "Southern Alps",
    ],
  );

  for (const range of MOUNTAIN_RANGES) {
    assert.ok(range.emoji, `${range.name} has a map icon`);
    assert.ok(range.description, `${range.name} has an explanation`);
    assert.ok(
      Math.abs(range.coordinates[0]) <= 180 &&
        Math.abs(range.coordinates[1]) <= 90,
      `${range.name} has valid map coordinates`,
    );
  }
});
