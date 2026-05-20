'use client';

import { getCountryProfile } from '@/data/countries';

/**
 * Tab 4 — help resources (shared component for country deep-dive).
 * @param {{ iso: string }} props
 */
export default function CountryHelpResources({ iso }) {
  const profile = getCountryProfile(iso);
  const resources = profile.helpResources ?? [];

  if (!resources.length) {
    return (
      <p className="country-deep-dive__muted">
        Δεν υπάρχουν καταχωρημένοι πόροι για αυτή τη χώρα. Πρόσθεσέ τους στο{' '}
        <code>src/data/countries.js</code>.
      </p>
    );
  }

  return (
    <ul className="country-deep-dive__resources">
      {resources.map((r) => (
        <li key={r.name}>
          <strong>{r.name}</strong>
          {r.href ? (
            <>
              :{' '}
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="app-link">
                {r.detail}
              </a>
            </>
          ) : (
            <> — {r.detail}</>
          )}
        </li>
      ))}
    </ul>
  );
}
