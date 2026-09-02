/** Brutalist padel racket mark — flat shapes, hard edges, no gradients. */
export function Padel360Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="0" y="0" width="48" height="48" className="fill-court" />
      <rect x="10" y="4" width="28" height="30" className="fill-ink" />
      <circle cx="18" cy="13" r="2.2" className="fill-court" />
      <circle cx="24" cy="13" r="2.2" className="fill-court" />
      <circle cx="30" cy="13" r="2.2" className="fill-court" />
      <circle cx="18" cy="20" r="2.2" className="fill-court" />
      <circle cx="24" cy="20" r="2.2" className="fill-court" />
      <circle cx="30" cy="20" r="2.2" className="fill-court" />
      <circle cx="21" cy="27" r="2.2" className="fill-court" />
      <circle cx="27" cy="27" r="2.2" className="fill-court" />
      <rect x="21" y="34" width="6" height="10" className="fill-ink" />
      <rect x="17" y="42" width="14" height="4" className="fill-clay" />
    </svg>
  );
}
