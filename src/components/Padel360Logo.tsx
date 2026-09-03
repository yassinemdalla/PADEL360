/** PADEL360 mark — 360 ring, flat racket with punched holes, ball breaking the ring. */
export function Padel360Logo({ className = "size-9" }: { className?: string }) {
  const holes = [
    [20, 20],
    [26, 19],
    [32, 20],
    [19, 26],
    [25, 25],
    [31, 26],
    [20, 32],
    [26, 31],
    [32, 32],
    [23, 37],
    [29, 37],
  ] as const;

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="PADEL360">
      {/* 360 ring, broken where the ball sits */}
      <path
        d="M46 10 A24 24 0 1 0 55 30"
        className="stroke-court"
        strokeWidth="5"
        fill="none"
        strokeLinecap="butt"
      />
      {/* racket head + throat + handle */}
      <path
        d="M26 8 C38 8 44 17 44 26 C44 35 37 42 30 42 L24 54 C23 57 18 57 17 54 C16 51 19 49 21 47 L22 41 C15 38 10 31 10 24 C10 15 16 8 26 8 Z"
        className="fill-ink"
      />
      {holes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2" className="fill-court" />
      ))}
      {/* ball */}
      <circle cx="49" cy="14" r="8" className="fill-court" />
      <path d="M43 9 A9 9 0 0 1 44 20" className="stroke-sand" strokeWidth="1.6" fill="none" />
      <path d="M55 9 A9 9 0 0 0 54 20" className="stroke-sand" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
