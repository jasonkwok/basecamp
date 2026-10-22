import assert from "node:assert/strict";
import test from "node:test";
import {
  getSessionSummitedMountainIds,
  getSessionSummitSnapshot,
  setMountainSummited,
  subscribeToSummitMark,
} from "../app/data/session-summits.ts";

function useSessionStorageForTest() {
  const values = new Map();
  const listeners = new Map();

  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    addEventListener: (name, listener) => {
      const callbacks = listeners.get(name) ?? new Set();
      callbacks.add(listener);
      listeners.set(name, callbacks);
    },
    removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
    dispatchEvent: (event) => {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    },
  };

  return values;
}

test("summited mountain IDs are saved and updated in the current session", () => {
  const storage = useSessionStorageForTest();

  setMountainSummited("everest", true);
  setMountainSummited("k2", true);
  setMountainSummited("everest", false);

  assert.deepEqual(getSessionSummitedMountainIds(), ["k2"]);
  assert.equal(storage.size, 1);
});

test("session snapshot changes when one summit is replaced by another", () => {
  useSessionStorageForTest();

  setMountainSummited("everest", true);
  const beforeReplacement = getSessionSummitSnapshot();

  setMountainSummited("everest", false);
  setMountainSummited("k2", true);

  assert.notEqual(getSessionSummitSnapshot(), beforeReplacement);
});

test("invalid session data is ignored", () => {
  const storage = useSessionStorageForTest();

  storage.set("basecamp:summited-mountains:v1", '{"everest":true}');

  assert.deepEqual(getSessionSummitedMountainIds(), []);
});

test("marking a summit emits an event but unmarking does not", () => {
  useSessionStorageForTest();
  let marks = 0;
  const unsubscribe = subscribeToSummitMark(() => marks++);

  setMountainSummited("everest", true);
  setMountainSummited("everest", false);
  unsubscribe();

  assert.equal(marks, 1);
});
