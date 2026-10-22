import { useEffect, useRef, useState } from "react";
import {
  getMountainBudget,
  formatMountainBudget,
} from "../../data/mountain-budgets";
import type { Summit } from "../../data/mountains";
import { MOUNTAIN_TAGS } from "../../data/mountain-tags";
import { DIFFICULTY_LEVELS } from "../../data/difficulty-levels";

import MountainGuideModal from "./mountain-guide-modal";
import SummitProgressControl from "./summit-progress-control";

const metres = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const feet = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

// Present catalog facts separately from ascent-specific editorial estimates.
export default function MountainProfile({
  summit,
  onClose,
  onBack,
  backLabel = "Back to nearby peaks",
}: {
  summit: Summit;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  const [guide, setGuide] = useState<"difficulty" | "altitude" | null>(null);

  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [summit.id]);

  const [longitude, latitude] = summit.coordinates;
  const budget = getMountainBudget(summit);
  const difficulty = DIFFICULTY_LEVELS[summit.difficulty.level];

  return (
    <section
      className="mountain-profile"
      aria-labelledby="mountain-profile-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();

          onClose();
        }
      }}
    >
      <div className="profile-topline">
        {onBack ? (
          <button
            type="button"
            aria-label={backLabel}
            title={backLabel}
            onClick={onBack}
          >
            ←
          </button>
        ) : (
          <span>FIELD NOTES</span>
        )}
        <button aria-label="Close mountain details" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="profile-illustration" aria-hidden="true" />

      <h2 id="mountain-profile-title" ref={heading} tabIndex={-1}>
        {summit.name}
      </h2>

      <p className="profile-location">
        {summit.location} · {summit.region}
      </p>

      <div className="profile-badges">
        {summit.tags.map((id) => (
          <span
            key={id}
            className="mountain-badge"
            data-tag={id}
            title={MOUNTAIN_TAGS[id].description}
          >
            {MOUNTAIN_TAGS[id].icon} {MOUNTAIN_TAGS[id].label}
          </span>
        ))}
      </div>

      <p className="profile-description">{summit.description}</p>

      <SummitProgressControl summit={summit} />

      <div className="profile-difficulty">
        <span className="difficulty-caption">
          <span>BASECAMP ASCENT RATING</span>
          <button
            className="info-button"
            aria-label="More info about difficulty levels"
            title="How difficulty is rated"
            onClick={() => setGuide("difficulty")}
          >
            ?
          </button>
        </span>
        <strong
          className="difficulty-rating"
          data-difficulty={summit.difficulty.level}
        >
          {difficulty.icon} {difficulty.fullLabel}
        </strong>
        <p>
          <b>For:</b> {summit.difficulty.ascent}
        </p>
        <p>{summit.difficulty.rationale}</p>
        <small>
          Editorial guide for this ascent. Route, season and conditions change
          the difficulty.
        </small>
      </div>

      <div className="profile-trip">
        <span className="difficulty-caption">TRIP LENGTH ESTIMATE</span>
        <strong>
          🗓️{" "}
          {formatTripLength(
            summit.tripLength.minDays,
            summit.tripLength.maxDays,
          )}
        </strong>
        <p>{summit.tripLength.context}</p>
        <small>
          Basecamp planning estimate for the ascent above. Pace, conditions,
          permits and logistics can change the duration.
        </small>
      </div>

      <div className="profile-trip">
        <span className="difficulty-caption">ESTIMATED ROUTE BUDGET</span>
        <strong>{formatMountainBudget(budget)}</strong>
        <p>Per person · {budget.basis}</p>
        <small>
          {budget.confidence === "price-informed"
            ? "Planning range informed by published operator prices."
            : "Rough estimate based on comparable trips."}{" "}
        </small>
      </div>

      <dl className="profile-facts">
        <div className="profile-elevation">
          <dt>
            <span>
              {summit.kind === "destination"
                ? "Site elevation"
                : "Summit elevation"}
            </span>
            <button
              className="info-button"
              aria-label="More info about altitude ranges"
              title="Understand altitude ranges"
              onClick={() => setGuide("altitude")}
            >
              ?
            </button>
          </dt>
          <dd>
            {metres.format(summit.elevationMeters)} <span>m</span>
            <small>
              {feet.format(summit.elevationMeters * 3.280839895)} ft above sea
              level
            </small>
          </dd>
        </div>
        <div>
          <dt>Latitude</dt>
          <dd>
            {Math.abs(latitude).toFixed(4)}° {latitude < 0 ? "S" : "N"}
          </dd>
        </div>
        <div>
          <dt>Longitude</dt>
          <dd>
            {Math.abs(longitude).toFixed(4)}° {longitude < 0 ? "W" : "E"}
          </dd>
        </div>
      </dl>

      <p className="profile-location-note">
        Approximate mountain location. Reported elevations can vary by survey
        and snow cover.
      </p>

      <details className="profile-sources">
        <summary>Sources &amp; references</summary>
        <ul>
          {summit.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label} ↗
              </a>
            </li>
          ))}
          <li>
            <a
              href={summit.difficulty.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ascent context ↗
            </a>
          </li>
          <li>
            <a
              href={summit.tripLength.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Trip route context ↗
            </a>
          </li>
          <li>
            <a
              href={budget.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {budget.confidence === "price-informed"
                ? "Budget price reference"
                : "Budget route / comparable-trip context"}{" "}
              ↗
            </a>
          </li>
        </ul>
      </details>

      {guide ? (
        <MountainGuideModal
          kind={guide}
          summit={summit}
          onClose={() => setGuide(null)}
        />
      ) : null}
    </section>
  );
}

// Longer trips use approximate 30-day months while retaining the original day range.
function formatTripLength(min: number, max: number) {
  if (min >= 30) {
    const lower = Math.round((min / 30) * 10) / 10;
    const upper = Math.round((max / 30) * 10) / 10;

    return `About ${lower === upper ? lower : `${lower}–${upper}`} months (${min}–${max} days)`;
  }

  return min === max
    ? `${min} ${min === 1 ? "day" : "days"}`
    : `${min}–${max} days`;
}
