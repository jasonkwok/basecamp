import assert from "node:assert/strict";
import test from "node:test";
import {
  findMountainRangeForGroup,
  MOUNTAIN_RANGES,
} from "../app/data/mountain-ranges.ts";

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

test("clusters name a range only when all peaks share its area", () => {
  assert.equal(
    findMountainRangeForGroup([
      [86.9, 27.9],
      [87.0, 28.0],
    ])?.name,
    "Himalayas",
  );
  assert.equal(
    findMountainRangeForGroup([
      [76.5, 35.9],
      [75.6, 36.0],
    ])?.name,
    "Karakoram",
  );
  assert.equal(
    findMountainRangeForGroup([
      [86.9, 27.9],
      [-70, -20],
    ]),
    null,
  );
});
