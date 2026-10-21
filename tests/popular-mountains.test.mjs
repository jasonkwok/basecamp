import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = JSON.parse(
  readFileSync(new URL("../app/data/mountains.json", import.meta.url), "utf8"),
);

test("Popular remains a curated set of exactly 20 destinations", () => {
  const popularNames = catalog.mountains
    .filter((mountain) => mountain.tags.includes("popular"))
    .map((mountain) => mountain.name)
    .sort();

  assert.equal(popularNames.length, 20);
  assert.deepEqual(popularNames, [
    "Aconcagua",
    "Annapurna Circuit",
    "Aoraki / Mount Cook",
    "Cotopaxi",
    "Denali",
    "Everest",
    "Everest Base Camp Trek",
    "Fitz Roy",
    "Inca Trail to Machu Picchu",
    "K2",
    "Kilimanjaro",
    "Machu Picchu",
    "Matterhorn",
    "Mont Blanc",
    "Mount Fuji",
    "Mount Kinabalu",
    "Mount Rainier",
    "Mount Whitney",
    "Toubkal",
    "Tour du Mont Blanc",
  ]);
});
