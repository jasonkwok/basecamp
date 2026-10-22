import { useState } from "react";
import { MOUNTAINS, type Summit } from "../../data/mountains";
import { MOUNTAIN_TAGS, type MountainTagId } from "../../data/mountain-tags";
import {
  DIFFICULTY_LEVELS,
  type DifficultyLevel,
} from "../../data/difficulty-levels";
import {
  matchesElevation,
  type ElevationFilter,
} from "../../data/mountain-filters";

// The catalog is static, so option lists and badge counts are computed once.
const regions = [...new Set(MOUNTAINS.map((summit) => summit.region))].sort();
const tagCounts = Object.fromEntries(
  Object.keys(MOUNTAIN_TAGS).map((tag) => [
    tag,
    MOUNTAINS.filter((summit) => summit.tags.includes(tag as MountainTagId))
      .length,
  ]),
);

type MountainPickerProps = {
  ready: boolean;
  open: boolean;
  onToggle: (open: boolean) => void;
  onSelect: (summit: Summit) => void;
};

// Keep filter input local so typing does not rerender the globe and its panels.
export default function MountainPicker({
  ready,
  open,
  onToggle,
  onSelect,
}: MountainPickerProps) {
  const [collection, setCollection] = useState<MountainTagId | "all">("all");
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<
    DifficultyLevel | "all"
  >("all");
  const [altitudeFilter, setAltitudeFilter] = useState<ElevationFilter>("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const query = search.trim().toLocaleLowerCase();

  // Combine all active filters; derive results without duplicating them in state.
  const listedSummits = MOUNTAINS.filter((summit) => {
    const matchesTag = collection === "all" || summit.tags.includes(collection);
    const matchesDifficulty =
      difficultyFilter === "all" ||
      summit.difficulty.level === difficultyFilter;
    const matchesAltitude = matchesElevation(
      summit.elevationMeters,
      altitudeFilter,
    );
    const matchesRegion =
      regionFilter === "all" || summit.region === regionFilter;
    // Search descriptions and category labels as well as mountain names.
    const haystack =
      `${summit.name} ${summit.region} ${summit.location} ${summit.description} ${summit.tags.map((tag) => MOUNTAIN_TAGS[tag].label).join(" ")} ${DIFFICULTY_LEVELS[summit.difficulty.level].label}`.toLocaleLowerCase();

    return (
      matchesTag &&
      matchesDifficulty &&
      matchesAltitude &&
      matchesRegion &&
      haystack.includes(query)
    );
  });
  const hasActiveFilters = Boolean(
    search ||
    collection !== "all" ||
    difficultyFilter !== "all" ||
    altitudeFilter !== "all" ||
    regionFilter !== "all",
  );

  return (
    <details
      className="summit-picker"
      open={open}
      onToggle={(event) => {
        onToggle(event.currentTarget.open);
      }}
    >
      <summary>
        🏔️ Mountains · {MOUNTAINS.length} <span aria-hidden="true">⌃</span>
      </summary>

      <div className="summit-menu">
        <p>Search peaks, then narrow by tag, challenge, height or region.</p>
        <input
          className="summit-search"
          type="search"
          aria-label="Search mountains"
          placeholder="Search mountains…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="summit-filters">
          <select
            aria-label="Filter by tag"
            value={collection}
            onChange={(event) =>
              setCollection(event.target.value as MountainTagId | "all")
            }
          >
            <option value="all">All tags · {MOUNTAINS.length}</option>
            {Object.entries(MOUNTAIN_TAGS).map(([id, tag]) => (
              <option key={id} value={id}>
                {tag.icon} {tag.label} · {tagCounts[id]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by difficulty"
            value={difficultyFilter}
            onChange={(event) =>
              setDifficultyFilter(event.target.value as DifficultyLevel | "all")
            }
          >
            <option value="all">All difficulties</option>
            {Object.entries(DIFFICULTY_LEVELS).map(([id, level]) => (
              <option key={id} value={id}>
                {level.icon} {level.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by elevation"
            value={altitudeFilter}
            onChange={(event) =>
              setAltitudeFilter(event.target.value as ElevationFilter)
            }
          >
            <option value="all">Any elevation</option>
            <option value="under-2500">Under 2,500 m</option>
            <option value="2500-3999">2,500–3,999 m</option>
            <option value="4000-5999">4,000–5,999 m</option>
            <option value="6000-7999">6,000–7,999 m</option>
            <option value="8000-plus">8,000 m+</option>
          </select>
          <select
            aria-label="Filter by region"
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
          >
            <option value="all">All regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        <div className="summit-result-row">
          <small className="summit-result-count" aria-live="polite">
            Showing {listedSummits.length} of {MOUNTAINS.length} peaks
          </small>
          {hasActiveFilters ? (
            <button
              className="summit-clear-filters"
              onClick={() => {
                setSearch("");
                setCollection("all");
                setDifficultyFilter("all");
                setAltitudeFilter("all");
                setRegionFilter("all");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <ul>
          {listedSummits.map((summit) => {
            const difficulty = DIFFICULTY_LEVELS[summit.difficulty.level];

            return (
              <li key={summit.id}>
                <button
                  className="summit-option"
                  disabled={!ready}
                  onClick={() => onSelect(summit)}
                >
                  <span className="summit-option-heading">
                    <strong>{summit.name}</strong>
                    <small>
                      {summit.region} ·{" "}
                      {summit.elevationMeters.toLocaleString()} m
                    </small>
                  </span>
                  <span className="summit-option-badges">
                    {summit.tags.map((tag) => (
                      <span
                        key={tag}
                        className="mountain-badge"
                        data-tag={tag}
                        title={MOUNTAIN_TAGS[tag].description}
                      >
                        {MOUNTAIN_TAGS[tag].icon} {MOUNTAIN_TAGS[tag].label}
                      </span>
                    ))}
                    <span
                      className="mountain-badge difficulty-badge"
                      data-difficulty={summit.difficulty.level}
                      title={summit.difficulty.ascent}
                    >
                      {difficulty.icon} {difficulty.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {listedSummits.length === 0 ? (
            <li className="summit-empty">
              No peaks match these filters. Try widening your search.
            </li>
          ) : null}
        </ul>
        <small className="summit-note">
          7 Summits · 14 eight-thousanders · {tagCounts.popular} popular picks
        </small>
      </div>
    </details>
  );
}
