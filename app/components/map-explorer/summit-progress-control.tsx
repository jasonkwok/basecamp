"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getEmptySessionSummitSnapshot,
  getSessionSummitSnapshot,
  setMountainSummited,
  subscribeToSessionSummits,
} from "../../data/session-summits";
import type { Summit } from "../../data/mountains";

const CELEBRATION_DURATION_MS = 2200;

export default function SummitProgressControl({ summit }: { summit: Summit }) {
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTimer = useRef<number | null>(null);

  const serializedSummitIds = useSyncExternalStore(
    subscribeToSessionSummits,
    getSessionSummitSnapshot,
    getEmptySessionSummitSnapshot,
  );
  const hasSummited = (JSON.parse(serializedSummitIds) as string[]).includes(
    summit.id,
  );

  useEffect(
    () => () => {
      if (celebrationTimer.current !== null) {
        window.clearTimeout(celebrationTimer.current);
      }
    },
    [],
  );

  function toggleSummited() {
    const nextSummited = !hasSummited;

    if (celebrationTimer.current !== null) {
      window.clearTimeout(celebrationTimer.current);
    }

    // Celebrate a new summit mark; removing one stays a quiet action.
    setShowCelebration(nextSummited);

    if (nextSummited) {
      celebrationTimer.current = window.setTimeout(
        () => setShowCelebration(false),
        CELEBRATION_DURATION_MS,
      );
    }

    setMountainSummited(summit.id, nextSummited);
  }

  return (
    <div className="summit-progress">
      {showCelebration ? (
        <span className="summit-celebration" role="status">
          <span>🎉 Congratulations on summiting {summit.name}!</span>
          <span className="summit-confetti" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </span>
      ) : null}

      <button
        type="button"
        className={showCelebration ? "is-celebrating" : undefined}
        aria-pressed={hasSummited}
        onClick={toggleSummited}
      >
        <span aria-hidden="true">🏁</span>
        {hasSummited ? "Summited" : "Summited?"}
      </button>

      <small>
        Saved for this session to personalize future recommendations.
      </small>
    </div>
  );
}
