import assert from "node:assert/strict";
import test from "node:test";
import {
  getSummitSelectionZoom,
  MAP_START_CENTER,
  MAX_EXPLORER_ZOOM,
} from "../app/components/map-explorer/map-camera.ts";

test("map starts centered on the United States", () => {
  assert.deepEqual(MAP_START_CENTER, [-98, 39]);
});

test("mountain selection zooms in without exceeding the map limit", () => {
  assert.equal(getSummitSelectionZoom(2), 5.5);
  assert.equal(getSummitSelectionZoom(5), 5.5);
  assert.equal(getSummitSelectionZoom(5.5), MAX_EXPLORER_ZOOM);
});
