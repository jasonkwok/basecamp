import type { useMapExplorer } from "./use-map-explorer";

// Reuse only the controller fields needed by these controls.
type MapControlsProps = Pick<
  ReturnType<typeof useMapExplorer>,
  | "map"
  | "status"
  | "message"
  | "atMaxZoom"
  | "atMinZoom"
  | "help"
  | "setHelp"
  | "reset"
  | "retry"
>;

// Disable camera actions until Mapbox is ready and respect explorer zoom limits.
export default function MapControls({
  map,
  status,
  message,
  atMaxZoom,
  atMinZoom,
  help,
  setHelp,
  reset,
  retry,
}: MapControlsProps) {
  return (
    <>
      <nav className="map-tools" aria-label="Map controls">
        <div className="zoom-tools">
          <button
            aria-label="Zoom in"
            title={atMaxZoom ? "Closest explorer view" : "Zoom in"}
            disabled={status !== "ready" || atMaxZoom}
            onClick={() => map.current?.zoomIn({ duration: 0 })}
          >
            +
          </button>
          <button
            aria-label="Zoom out"
            title={atMinZoom ? "Widest world view" : "Zoom out"}
            disabled={status !== "ready" || atMinZoom}
            onClick={() => map.current?.zoomOut({ duration: 0 })}
          >
            −
          </button>
        </div>
        <button disabled={status !== "ready"} onClick={reset}>
          ↖ World view
        </button>
        <button
          aria-expanded={help}
          aria-controls="map-help"
          onClick={() => setHelp((previous) => !previous)}
        >
          How to explore
        </button>
      </nav>

      {help ? (
        <section id="map-help" className="help-card" aria-label="Map help">
          <h2>Around the world</h2>
          <p>
            Drag to pan. Pinch or scroll to zoom. With the map focused, use
            arrow keys and + / −. Zoom stops at a regional overview to keep
            exploration simple.
          </p>
          <p>You can also tap a direction:</p>
          <div className="pan-tools">
            {/* Pan offsets move the camera in screen pixels, not geographic degrees. */}
            {(
              [
                ["←", "west", [120, 0]],
                ["↑", "north", [0, 120]],
                ["↓", "south", [0, -120]],
                ["→", "east", [-120, 0]],
              ] as const
            ).map(([icon, direction, offset]) => (
              <button
                key={direction}
                aria-label={`Pan ${direction}`}
                disabled={status !== "ready"}
                onClick={() =>
                  map.current?.panBy([offset[0], offset[1]], { duration: 0 })
                }
              >
                {icon}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Loading is announced politely; failures use an alert and expose retry. */}
      {status !== "ready" ? (
        <div
          className="map-status"
          role={status === "error" ? "alert" : "status"}
        >
          <span aria-hidden="true">{status === "loading" ? "◎" : "☁"}</span>
          <h2>
            {status === "loading"
              ? "Adventure is on the horizon"
              : "A small detour"}
          </h2>
          <p>{message}</p>
          {status === "error" ? (
            <button
              onClick={() => {
                retry();
              }}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
