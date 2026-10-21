export default function ExplorerSky() {
  return (
    <div className="star-field" aria-hidden="true">
      <div className="sky-sun">☀️</div>

      <div className="sky-moon">🌙</div>
      {[
        [7, 24],
        [21, 12],
        [38, 8],
        [61, 11],
        [83, 19],
        [94, 36],
        [12, 48],
        [29, 34],
        [77, 40],
        [88, 58],
        [5, 72],
        [20, 83],
        [39, 91],
        [65, 87],
        [77, 75],
        [95, 88],
        [52, 5],
        [47, 78],
      ].map(([left, top], index) => (
        <span
          key={`${left}-${top}`}
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          {index % 3 === 0 ? "✨" : "⭐"}
        </span>
      ))}
    </div>
  );
}
