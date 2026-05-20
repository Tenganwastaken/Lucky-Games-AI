/** Decorative SVG for advisor charts empty state */
export default function AnalysisEmptyIllustration() {
  return (
    <svg
      className="empty-illustration-analysis"
      viewBox="0 0 200 140"
      width="200"
      height="140"
      aria-hidden
      focusable="false"
    >
      <rect x="24" y="88" width="22" height="36" rx="4" fill="var(--border-strong)" opacity="0.55" />
      <rect x="54" y="72" width="22" height="52" rx="4" fill="var(--border-strong)" opacity="0.7" />
      <rect x="84" y="56" width="22" height="68" rx="4" fill="var(--accent)" opacity="0.35" />
      <rect x="114" y="64" width="22" height="60" rx="4" fill="var(--border-strong)" opacity="0.65" />
      <rect x="144" y="80" width="22" height="44" rx="4" fill="var(--border-strong)" opacity="0.5" />
      <path
        d="M20 48 L60 38 L100 52 L140 28 L180 42"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <rect x="108" y="12" width="72" height="36" rx="10" fill="var(--surface)" stroke="var(--border)" />
      <circle cx="122" cy="30" r="6" fill="var(--accent)" opacity="0.4" />
      <rect x="134" y="24" width="36" height="6" rx="3" fill="var(--border-strong)" opacity="0.5" />
      <rect x="134" y="34" width="28" height="5" rx="2.5" fill="var(--border)" />
    </svg>
  );
}
