/** Decorative orbital SVG — desktop only (hidden via CSS on small screens). */
export default function HeroOrbits() {
  return (
    <svg
      viewBox="-100 -100 200 200"
      className="hero-orbits"
      aria-hidden="true"
      focusable="false"
    >
      <circle r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="0.75" />
      <circle r="65" fill="none" stroke="var(--border-subtle)" strokeWidth="0.75" />
      <circle r="90" fill="none" stroke="var(--border-subtle)" strokeWidth="0.75" />
      <g className="orbit-1">
        <circle cx="40" cy="0" r="3" fill="var(--color-accent)" />
      </g>
      <g className="orbit-2">
        <circle cx="65" cy="0" r="2" fill="var(--color-risk-medium)" />
      </g>
      <g className="orbit-3">
        <circle cx="90" cy="0" r="2.5" fill="var(--color-risk-high)" />
      </g>
    </svg>
  );
}
