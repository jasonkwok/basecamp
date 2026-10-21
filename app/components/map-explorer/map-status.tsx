import type { useMapExplorer } from "./use-map-explorer";

type MapStatusProps = Pick<
  ReturnType<typeof useMapExplorer>,
  "status" | "message" | "retry"
>;

// Keep loading and recovery feedback visible without adding map controls.
export default function MapStatus({
  status,
  message,
  retry,
}: MapStatusProps) {
  if (status === "ready") return null;

  return (
    <div className="map-status" role={status === "error" ? "alert" : "status"}>
      <span aria-hidden="true">{status === "loading" ? "◎" : "☁"}</span>
      <h2>
        {status === "loading" ? "Adventure is on the horizon" : "A small detour"}
      </h2>
      <p>{message}</p>
      {status === "error" ? <button onClick={retry}>Try again</button> : null}
    </div>
  );
}
