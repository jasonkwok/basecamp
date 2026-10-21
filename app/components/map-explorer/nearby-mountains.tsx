import { useEffect, useRef } from "react";
import type { Summit } from "../../data/mountains";
import { MOUNTAIN_TAGS } from "../../data/mountain-tags";

type NearbyMountainsProps = {
  nearbySummits: Summit[];
  onClose: () => void;
  onSelect: (summit: Summit) => void;
};

export default function NearbyMountains({
  nearbySummits,
  onClose,
  onSelect,
}: NearbyMountainsProps) {
  const nearbyHeading = useRef<HTMLHeadingElement>(null);

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
          {nearbySummits.length} nearby peaks
        </h2>
        <button
          aria-label="Close nearby peaks"
          onClick={() => {
            onClose();
          }}
        >
          ×
        </button>
      </div>
      <p>
        A whole range of possibilities. Pick a mountain to bring it into view.
      </p>

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
