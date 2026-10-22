import { useEffect, useRef } from "react";
import {
  DIFFICULTY_LEVELS,
  type DifficultyLevel,
} from "../../../data/difficulty-levels";
import type { MountainCatalogEntry } from "../../../data/mountains";

const bands: {
  label: string;
  range: string;
  min: number;
  max: number;
  reason: string;
}[] = [
  {
    label: "Lower altitude",
    range: "Below 2,500 m",
    min: 0,
    max: 2500,
    reason:
      "Less altitude exposure, but terrain, weather and individual health still matter. This is not a safety threshold.",
  },
  {
    label: "High altitude",
    range: "2,500–3,499 m",
    min: 2500,
    max: 3500,
    reason:
      "Altitude illness becomes a concern, especially with rapid ascent from low elevations.",
  },
  {
    label: "Very high altitude",
    range: "3,500–5,499 m",
    min: 3500,
    max: 5500,
    reason:
      "Reduced oxygen pressure makes exertion harder. Acclimatization and ascent pace become increasingly important.",
  },
  {
    label: "Extreme altitude",
    range: "5,500–7,999 m",
    min: 5500,
    max: 8000,
    reason:
      "Severe oxygen limitation makes recovery difficult and prolonged exposure demanding, even for experienced climbers.",
  },
  {
    label: "Death zone",
    range: "8,000 m and above",
    min: 8000,
    max: Infinity,
    reason:
      "Humans cannot fully acclimatize for sustained stays. Supplemental oxygen is commonly used to reduce hypoxic stress, but some expert ascents are made without it. It is not a universal requirement or a guarantee of safety.",
  },
];
const reasons: Record<DifficultyLevel, string> = {
  beginner:
    "Established walking routes with limited technical demands in favourable conditions. Basic fitness and preparation still matter.",
  intermediate:
    "Longer or steeper hikes on uneven ground. Good fitness, navigation and some hiking experience help.",
  difficult:
    "Strenuous trekking, scrambling or exposed terrain. Strong fitness, sure footing and mountain judgement are needed.",
  expert:
    "Technical rock, snow or glacier climbing, serious exposure or major altitude. Specialist skills, equipment and experienced support are usually needed.",
  extreme:
    "The most demanding expeditions, combining death-zone altitude with prolonged exposure and serious objective hazards. Expert preparation cannot remove the risks.",
};

export default function MountainGuideModal({
  kind,
  summit,
  onClose,
}: {
  kind: "difficulty" | "altitude";
  summit: MountainCatalogEntry;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  // Restore focus to the triggering control when the modal unmounts.
  useEffect(() => {
    const node = dialog.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    node?.showModal();

    return () => {
      node?.close();

      previous?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="mountain-guide"
      aria-labelledby="mountain-guide-title"
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
      onCancel={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();

        // Cycle focus within the modal, including its external reference links.
        if (event.key === "Tab") {
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button, a[href], [tabindex="0"]',
            ),
          );
          const first = controls[0],
            last = controls.at(-1);

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();

            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();

            first?.focus();
          }
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          // Dialog backdrop clicks target the dialog itself; test its bounds.
          const box = event.currentTarget.getBoundingClientRect();

          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            dialog.current?.close();
        }
      }}
    >
      <div className="guide-topline">
        <span>BASECAMP FIELD GUIDE</span>
        <button
          autoFocus
          aria-label="Close field guide"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
      </div>

      <h2 id="mountain-guide-title">
        {kind === "difficulty"
          ? "Find your adventure level"
          : "A little altitude perspective"}
      </h2>

      <p>
        {kind === "difficulty"
          ? "Our five editorial bands describe the named ascent, not an official climbing grade. Elevation alone does not determine difficulty."
          : "These approximate Basecamp display bands explain elevation, not personal medical risk. Definitions vary; altitude illness can occur around 2,450 m or lower. Sleeping altitude and speed of ascent matter, too."}
      </p>

      <p className="guide-current">
        <b>{summit.name}</b> ·{" "}
        {kind === "difficulty"
          ? summit.difficulty.ascent
          : `${summit.elevationMeters.toLocaleString("en-US")} m above sea level`}
      </p>

      <ul className="guide-bands">
        {kind === "difficulty"
          ? (
              Object.entries(DIFFICULTY_LEVELS) as [
                DifficultyLevel,
                (typeof DIFFICULTY_LEVELS)[DifficultyLevel],
              ][]
            ).map(([id, band]) => (
              <li key={id} data-current={id === summit.difficulty.level}>
                <h3>
                  {band.icon} {band.label}
                  {id === summit.difficulty.level ? (
                    <small>THIS ASCENT</small>
                  ) : null}
                </h3>
                <p>{reasons[id]}</p>
              </li>
            ))
          : bands.map((band) => (
              <li
                key={band.label}
                data-current={
                  summit.elevationMeters >= band.min &&
                  summit.elevationMeters < band.max
                }
              >
                <h3>
                  {band.label} <small>{band.range}</small>
                </h3>
                <p>{band.reason}</p>
              </li>
            ))}
      </ul>

      {kind === "difficulty" ? (
        <p>
          Route, season, weather and access restrictions can change the
          challenge. Trip estimates describe a typical itinerary, not a
          recommended acclimatization schedule.
        </p>
      ) : (
        <p className="guide-references">
          Read more:{" "}
          <a
            href="https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            CDC altitude guidance ↗
          </a>{" "}
          ·{" "}
          <a
            href="https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2021.696335/full"
            target="_blank"
            rel="noopener noreferrer"
          >
            Research on death-zone ascents ↗
          </a>
        </p>
      )}
    </dialog>
  );
}
