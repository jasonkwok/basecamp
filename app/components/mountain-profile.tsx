import { useEffect, useRef, useState } from "react";
import type { Summit } from "../data/mountains";
import { MOUNTAIN_TAGS } from "../data/mountain-tags";
import { DIFFICULTY_LEVELS } from "../data/difficulty-levels";

import MountainGuideModal from "./mountain-guide-modal";

const metres = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const feet = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function MountainProfile({ summit, onClose }: { summit: Summit; onClose: () => void }) {
  const [guide, setGuide] = useState<"difficulty" | "altitude" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [summit.id]);
  const [longitude, latitude] = summit.coordinates;
  const difficulty = DIFFICULTY_LEVELS[summit.difficulty.level];
  return (
    <section className="mountain-profile" aria-labelledby="mountain-profile-title" onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
    }}>
      <div className="profile-topline"><span>FIELD NOTES</span><button aria-label="Close mountain details" onClick={onClose}>×</button></div>
      <div className="profile-illustration" aria-hidden="true" />
      <h2 id="mountain-profile-title" ref={heading} tabIndex={-1}>{summit.name}</h2>
      <p className="profile-location">{summit.location} · {summit.region}</p>
      <div className="profile-badges">{summit.tags.map((id) => <span key={id} className="mountain-badge" data-tag={id} title={MOUNTAIN_TAGS[id].description}>{MOUNTAIN_TAGS[id].icon} {MOUNTAIN_TAGS[id].label}</span>)}</div>
      <p className="profile-description">{summit.description}</p>
      <div className="profile-difficulty">
        <span className="difficulty-caption">BASECAMP ASCENT RATING <button className="info-button" aria-label="Explain difficulty levels" title="How difficulty is rated" onClick={() => setGuide("difficulty")}>i</button></span>
        <strong className="difficulty-rating" data-difficulty={summit.difficulty.level}>{difficulty.icon} {difficulty.fullLabel}</strong>
        <p><b>For:</b> {summit.difficulty.ascent}</p>
        <p>{summit.difficulty.rationale}</p>
        <small>Editorial guide for this ascent. Route, season and conditions change the difficulty.</small>
      </div>
      <div className="profile-trip"><span className="difficulty-caption">TRIP LENGTH ESTIMATE</span><strong>🗓️ {formatTripLength(summit.tripLength.minDays, summit.tripLength.maxDays)}</strong><p>{summit.tripLength.context}</p><small>Basecamp planning estimate for the ascent above. Pace, conditions, permits and logistics can change the duration.</small></div>
      <dl className="profile-facts">
        <div className="profile-elevation"><dt>{summit.kind === "destination" ? "Site elevation" : "Summit elevation"} <button className="info-button" aria-label="Explain altitude ranges" title="Understand altitude ranges" onClick={() => setGuide("altitude")}>i</button></dt><dd>{metres.format(summit.elevationMeters)} <span>m</span><small>{feet.format(summit.elevationMeters * 3.280839895)} ft above sea level</small></dd></div>
        <div><dt>Latitude</dt><dd>{Math.abs(latitude).toFixed(4)}° {latitude < 0 ? "S" : "N"}</dd></div>
        <div><dt>Longitude</dt><dd>{Math.abs(longitude).toFixed(4)}° {longitude < 0 ? "W" : "E"}</dd></div>
      </dl>
      <p className="profile-location-note">Approximate mountain location. Reported elevations can vary by survey and snow cover.</p>
      <details className="profile-sources"><summary>Sources &amp; references</summary><ul>{summit.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}<li><a href={summit.difficulty.sourceUrl} target="_blank" rel="noopener noreferrer">Ascent context ↗</a></li><li><a href={summit.tripLength.sourceUrl} target="_blank" rel="noopener noreferrer">Trip route context ↗</a></li></ul></details>
      {guide ? <MountainGuideModal kind={guide} summit={summit} onClose={() => setGuide(null)} /> : null}
    </section>
  );
}

function formatTripLength(min: number, max: number) {
  if (min >= 30) { const lower = Math.round(min / 30 * 10) / 10; const upper = Math.round(max / 30 * 10) / 10; return `About ${lower === upper ? lower : `${lower}–${upper}`} months (${min}–${max} days)`; }
  return min === max ? `${min} ${min === 1 ? "day" : "days"}` : `${min}–${max} days`;
}
