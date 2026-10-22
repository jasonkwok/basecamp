const SESSION_SUMMITS_KEY = "basecamp:summited-mountains:v1";
const SESSION_SUMMITS_EVENT = "basecamp:session-summits-change";
// A separate event lets the list open on a new mark, but stay closed on removal.
const SUMMIT_MARKED_EVENT = "basecamp:summit-marked";
const EMPTY_SESSION_SUMMIT_SNAPSHOT = "[]";

// Session storage keeps summit history in this tab without requiring an account.
export function getSessionSummitedMountainIds(): string[] {
  try {
    const savedIds = window.sessionStorage.getItem(SESSION_SUMMITS_KEY);
    const parsedIds: unknown = savedIds ? JSON.parse(savedIds) : [];

    return Array.isArray(parsedIds) && parsedIds.every((id) => typeof id === "string")
      ? parsedIds
      : [];
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
    return [];
  }
}

// React external-store snapshots must be stable values until the session changes.
export function getSessionSummitSnapshot(): string {
  return JSON.stringify(getSessionSummitedMountainIds());
}

export function getEmptySessionSummitSnapshot(): string {
  return EMPTY_SESSION_SUMMIT_SNAPSHOT;
}

export function setMountainSummited(mountainId: string, summited: boolean) {
  const summitIds = new Set(getSessionSummitedMountainIds());

  if (summited) {
    summitIds.add(mountainId);
  } else {
    summitIds.delete(mountainId);
  }

  try {
    window.sessionStorage.setItem(
      SESSION_SUMMITS_KEY,
      JSON.stringify([...summitIds]),
    );

    window.dispatchEvent(new Event(SESSION_SUMMITS_EVENT));

    if (summited) {
      window.dispatchEvent(new Event(SUMMIT_MARKED_EVENT));
    }
  } catch {
    // Keep the current interaction usable even when the browser blocks storage.
  }
}

export function subscribeToSessionSummits(onChange: () => void) {
  window.addEventListener(SESSION_SUMMITS_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(SESSION_SUMMITS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function subscribeToSummitMark(onMark: () => void) {
  window.addEventListener(SUMMIT_MARKED_EVENT, onMark);

  return () => {
    window.removeEventListener(SUMMIT_MARKED_EVENT, onMark);
  };
}
