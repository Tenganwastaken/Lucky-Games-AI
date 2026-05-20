'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import CountryHelpResources from '@/components/CountryHelpResources';
import ModalBackdrop from '@/components/ModalBackdrop';
import { getCountryProfile, flagEmoji, GREECE_REGULATORY_TEXT } from '@/data/countries';
import {
  COUNTRY_DEEP_DIVE_CLOSE,
  COUNTRY_TAB_HELP,
  COUNTRY_TAB_OVERVIEW,
  COUNTRY_TAB_REGULATORY,
  COUNTRY_TAB_USERS,
  COUNTRY_USERS_INSUFFICIENT,
  COUNTRY_USERS_MEAN_RISK,
  COUNTRY_USERS_SAMPLE,
  COUNTRY_USERS_TOP_INDICATORS,
  COUNTRY_PARTICIPATION_LABEL,
  COUNTRY_POPULATION_LABEL,
} from '@/lib/strings';

const TABS = [
  { id: 'overview', label: COUNTRY_TAB_OVERVIEW },
  { id: 'regulatory', label: COUNTRY_TAB_REGULATORY },
  { id: 'users', label: COUNTRY_TAB_USERS },
  { id: 'help', label: COUNTRY_TAB_HELP },
];

function formatPopulation(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString('el-GR', { maximumFractionDigits: 1 })} εκατ.`;
  }
  return n.toLocaleString('el-GR');
}

function renderRegulatoryParagraph(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/**
 * @param {{ iso: string | null, open: boolean, onClose: () => void }} props
 */
export default function CountryDeepDive({ iso, open, onClose }) {
  const [tab, setTab] = useState('overview');
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const tabPanelId = useId();

  const profile = iso ? getCountryProfile(iso) : null;

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    setTab('overview');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(t);
    };
  }, [open, iso]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open || !iso) {
      setUserStats(null);
      return undefined;
    }
    let cancelled = false;
    setStatsLoading(true);
    fetch(`/api/stats/country-deep-dive?iso=${encodeURIComponent(iso)}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUserStats(data);
      })
      .catch(() => {
        if (!cancelled) setUserStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, iso]);

  if (!open || !iso || !profile) return null;

  return (
    <>
      <ModalBackdrop
        className={`country-deep-dive-backdrop ${open ? 'country-deep-dive-backdrop--open' : ''}`}
        onClose={close}
        label={COUNTRY_DEEP_DIVE_CLOSE}
        open={open}
      />
      <div
        ref={panelRef}
        className={`country-deep-dive-modal ${open ? 'country-deep-dive-modal--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-deep-dive-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="country-deep-dive__header">
          <div>
            <span className="country-deep-dive__flag" aria-hidden>
              {flagEmoji(iso)}
            </span>
            <h2 id="country-deep-dive-title" className="country-deep-dive__title">
              {profile.name}
              <span className="country-deep-dive__iso"> ({iso})</span>
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="country-deep-dive__close"
            onClick={close}
            aria-label={COUNTRY_DEEP_DIVE_CLOSE}
          >
            ×
          </button>
        </header>

        <div className="country-deep-dive__tabs" role="tablist" aria-label="Ενότητες χώρας">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${tabPanelId}-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`${tabPanelId}-panel-${t.id}`}
              className={`country-deep-dive__tab${tab === t.id ? ' country-deep-dive__tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="country-deep-dive__body">
          {tab === 'overview' && (
            <div
              role="tabpanel"
              id={`${tabPanelId}-panel-overview`}
              aria-labelledby={`${tabPanelId}-tab-overview`}
            >
              <dl className="country-deep-dive__stats">
                <div>
                  <dt>{COUNTRY_POPULATION_LABEL}</dt>
                  <dd>{formatPopulation(profile.population)}</dd>
                </div>
                <div>
                  <dt>{COUNTRY_PARTICIPATION_LABEL}</dt>
                  <dd>
                    {profile.gamblingParticipationPct != null
                      ? `~${profile.gamblingParticipationPct}%`
                      : '—'}
                    <span className="country-deep-dive__muted"> (demo)</span>
                  </dd>
                </div>
              </dl>
              <p className="country-deep-dive__overview">{profile.overview}</p>
            </div>
          )}

          {tab === 'regulatory' && (
            <div
              role="tabpanel"
              id={`${tabPanelId}-panel-regulatory`}
              aria-labelledby={`${tabPanelId}-tab-regulatory`}
              className="country-deep-dive__regulatory"
            >
              {profile.regulatory?.kind === 'greece' ? (
                GREECE_REGULATORY_TEXT.split('\n\n').map((para, i) => (
                  <p key={i}>{renderRegulatoryParagraph(para)}</p>
                ))
              ) : (
                <>
                  <p>
                    <strong>Αρχή:</strong> {profile.regulatory?.authority}
                  </p>
                  <p>
                    <strong>Όριο ηλικίας:</strong> {profile.regulatory?.ageLimit}
                  </p>
                  <p>{profile.regulatory?.summary}</p>
                  {profile.regulatory?.sources?.length > 0 ? (
                    <p>
                      <strong>Πηγές:</strong>{' '}
                      {profile.regulatory.sources.map((url, i) => (
                        <span key={url}>
                          {i > 0 ? ' · ' : null}
                          <a href={url} target="_blank" rel="noopener noreferrer" className="app-link">
                            {url.replace(/^https?:\/\//, '')}
                          </a>
                        </span>
                      ))}
                    </p>
                  ) : null}
                  <p className="country-deep-dive__muted">
                    Επέκτεινε το dataset στο <code>src/data/countries.js</code> για πλήρες
                    κείμενο.
                  </p>
                </>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div
              role="tabpanel"
              id={`${tabPanelId}-panel-users`}
              aria-labelledby={`${tabPanelId}-tab-users`}
            >
              {statsLoading ? (
                <p className="country-deep-dive__muted" role="status" aria-live="polite">
                  Φόρτωση δεδομένων…
                </p>
              ) : userStats?.insufficient || (userStats?.sampleSize ?? 0) < 10 ? (
                <p className="callout callout--muted">{COUNTRY_USERS_INSUFFICIENT}</p>
              ) : (
                <>
                  <p>
                    {COUNTRY_USERS_SAMPLE}: <strong>{userStats.sampleSize}</strong>
                  </p>
                  <p>
                    {COUNTRY_USERS_MEAN_RISK}: <strong>{userStats.meanRiskScore}</strong> / 100
                  </p>
                  {userStats.topIndicators?.length > 0 ? (
                    <>
                      <p style={{ marginTop: '1rem', fontWeight: 600 }}>{COUNTRY_USERS_TOP_INDICATORS}</p>
                      <ol className="country-deep-dive__indicators">
                        {userStats.topIndicators.map((ind) => (
                          <li key={ind.indicator}>
                            <strong>{ind.label}</strong>
                            <span className="country-deep-dive__muted">
                              {' '}
                              (μέση συμβολή {ind.meanContribution.toFixed(1)} pts)
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : null}
                </>
              )}
            </div>
          )}

          {tab === 'help' && (
            <div
              role="tabpanel"
              id={`${tabPanelId}-panel-help`}
              aria-labelledby={`${tabPanelId}-tab-help`}
            >
              <CountryHelpResources iso={iso} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
