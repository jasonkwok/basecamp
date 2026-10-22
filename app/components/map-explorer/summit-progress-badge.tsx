"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getEmptySessionSummitSnapshot,
  getSessionSummitSnapshot,
  setMountainSummited,
  subscribeToSessionSummits,
  subscribeToSummitMark,
} from "../../data/session-summits";
import { MOUNTAINS, type Summit } from "../../data/mountains";
import { MOUNTAIN_TAGS } from "../../data/mountain-tags";

// Keep session progress visible while the map moves beneath the user.
export default function SummitProgressBadge({
  onSelect,
}: {
  onSelect: (summit: Summit) => void;
}) {
  const summitList = useRef<HTMLDetailsElement>(null);
  const serializedSummitIds = useSyncExternalStore(
    subscribeToSessionSummits,
    getSessionSummitSnapshot,
    getEmptySessionSummitSnapshot,
  );
  const summitedIds = new Set(JSON.parse(serializedSummitIds) as string[]);
  const summitedMountains = MOUNTAINS.filter((summit) =>
    summitedIds.has(summit.id),
  );

  useEffect(
    () =>
      subscribeToSummitMark(() => {
        if (summitList.current) {
          summitList.current.open = true;
        }
      }),
    [],
  );

  function openSummit(summit: Summit) {
    if (summitList.current) {
      summitList.current.open = false;
    }

    onSelect(summit);
  }

  return (
    <details ref={summitList} className="summit-list">
      <summary
        aria-label={`Open summit list with ${summitedMountains.length} marked`}
      >
        <span aria-hidden="true">🏁</span>
        Summit list · {summitedMountains.length}
      </summary>
      <div className="summit-list-panel">
        <h2>Your summits</h2>
        {summitedMountains.length > 0 ? (
          <>
            <p>Marked for this session</p>
            <ul>
              {summitedMountains.map((summit) => (
                <li className="summit-list-item" key={summit.id}>
                  <button
                    type="button"
                    className="summit-list-entry"
                    onClick={() => openSummit(summit)}
                  >
                    <strong>{summit.name}</strong>
                    <span className="summit-list-badges">
                      {summit.tags.map((tagId) => {
                        const tag = MOUNTAIN_TAGS[tagId];

                        return (
                          <span
                            className="mountain-badge"
                            data-tag={tagId}
                            key={tagId}
                          >
                            {tag.icon} {tag.label}
                          </span>
                        );
                      })}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="summit-list-remove"
                    aria-label={`Remove ${summit.name} from summit list`}
                    title={`Remove ${summit.name}`}
                    onClick={() => setMountainSummited(summit.id, false)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="summit-list-empty">
            Mark a summit in Field Notes and it’ll appear here.
          </p>
        )}
      </div>
    </details>
  );
}
