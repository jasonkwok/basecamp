import assert from "node:assert/strict";
import test from "node:test";
import {
  getGroupCamera,
  getGroupCloseZoom,
  getSummitCloseZoom,
  getSummitSelectionZoom,
  MAP_START_CENTER,
  MAX_EXPLORER_ZOOM,
} from "../app/components/map-explorer/map/map-camera.ts";

test("closing a group backs out its zoom step and respects the minimum", () => {
  assert.equal(getGroupCloseZoom(3.75, 1.4), 3);
  assert.equal(getGroupCloseZoom(1.7, 1.4), 1.4);
});

test("group selection centers the bounds and zooms in modestly", () => {
  assert.deepEqual(getGroupCamera([[80, 25], [84, 29], [81, 27]], 3), {
    center: [82, 27],
    zoom: 3.75,
  });
  assert.equal(getGroupCamera([[80, 25]], 5.3).zoom, MAX_EXPLORER_ZOOM);
  assert.equal(getGroupCamera([], 3), null);
});

test("group center stays at the dateline for ranges crossing it", () => {
  assert.deepEqual(getGroupCamera([[179, 50], [-179, 54]], 4).center, [-180, 52]);
});

test("map starts centered on the United States", () => {
  assert.deepEqual(MAP_START_CENTER, [-98, 39]);
});

test("closing a mountain backs out two zoom levels but respects the minimum", () => {
  assert.equal(getSummitCloseZoom(5.5, 1.4), 3.5);
  assert.equal(getSummitCloseZoom(2, 1.4), 1.4);
});

test("mountain selection zooms in without exceeding the map limit", () => {
  assert.equal(getSummitSelectionZoom(2), 5.5);
  assert.equal(getSummitSelectionZoom(5), 5.5);
  assert.equal(getSummitSelectionZoom(5.5), MAX_EXPLORER_ZOOM);
});
