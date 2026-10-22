import { useEffect, useRef } from "react";
import type { MountainCatalogEntry } from "../../../data/mountains";
import { MOUNTAIN_TAGS } from "../../../data/mountain-tags";
import { findMountainRangeForGroup } from "../../../data/mountain-ranges";

type NearbyMountainsProps = {
  nearbySummits: MountainCatalogEntry[];
  onClose: () => void;
  onSelect: (summit: MountainCatalogEntry) => void;
};

export default function NearbyMountains({
  nearbySummits,
  onClose,
  onSelect,
}: NearbyMountainsProps) {
  const nearbyHeading = useRef<HTMLHeadingElement>(null);
  const mountainRange = findMountainRangeForGroup(
    nearbySummits.map((summit) => summit.coordinates),
  );
  const peakCount = mountainRange?.peakCount ?? nearbySummits.length;
  const peakCountLabel = `${peakCount} ${peakCount === 1 ? "peak" : "peaks"}`;

  // Announce the newly opened group and give keyboard users a starting point.
  useEffect(() => {
    nearbyHeading.current?.focus();
  }, [nearbySummits]);

  return (
    <section
      className="nearby-panel"
      aria-labelledby="nearby-heading"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <div className="nearby-header">
        <h2 id="nearby-heading" ref={nearbyHeading} tabIndex={-1}>
          {mountainRange
            ? `${mountainRange.flags.join(" ")} ${mountainRange.name} · ${peakCountLabel}`
            : `${peakCount} nearby peaks`}
        </h2>
        <button
          aria-label="Close mountain group"
          onClick={() => {
            onClose();
          }}
        >
          ×
        </button>
      </div>
      {mountainRange ? (
        <p className="nearby-range-description">{mountainRange.description}</p>
      ) : null}
      <p>Pick a mountain to bring it into view.</p>

      <ul>
        {nearbySummits.map((summit) => (
          <li key={summit.id}>
            <button
              onClick={() => {
                onSelect(summit);
              }}
            >
              <strong>{summit.name}</strong>
              <span className="nearby-badges">
                {summit.tags.map((tag) => (
                  <span key={tag} className="mountain-badge" data-tag={tag}>
                    {MOUNTAIN_TAGS[tag].icon} {MOUNTAIN_TAGS[tag].label}
                  </span>
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
