'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { GAME_LABELS, LAYER_LABELS, MOCK_STATS } from '@/data/mockCountryGamblingStats';
import { isoFromRsmGeography as isoFromGeo } from '@/lib/map-iso';

const ADVISOR_POLL_MS = 5000;
const NO_DATA_FILL = '#cbd5e1';

/** Normalize API shape (object or legacy number). */
function advisorStats(entry) {
  if (entry == null) return null;
  if (typeof entry === 'number') {
    return { totalRuns: entry, guestRuns: 0, distinctUsers: 0 };
  }
  const totalRuns = Number(entry.totalRuns) || 0;
  const guestRuns = Number(entry.guestRuns) || 0;
  let distinctUsers = Number(entry.distinctUsers) || 0;
  if (guestRuns === totalRuns && totalRuns > 0) distinctUsers = 0;
  return { totalRuns, guestRuns, distinctUsers };
}

function advisorTotalRuns(entry) {
  const s = advisorStats(entry);
  return s && s.totalRuns > 0 ? s.totalRuns : null;
}

function valueForCountry(iso, gameType, layer, accountsByCountry, advisorByCountry) {
  if (!iso) return null;
  if (layer === 'accounts') {
    const n = accountsByCountry[iso];
    return typeof n === 'number' ? n : null;
  }
  if (layer === 'advisor') {
    return advisorTotalRuns(advisorByCountry[iso]);
  }
  const row = MOCK_STATS[iso];
  if (!row) return null;
  if (gameType === 'all') {
    return (row.lottery + row.slots + row.sports_bet + row.other) / 4;
  }
  return row[gameType] ?? null;
}

function extentValues(layer, gameType, accountsByCountry, advisorByCountry) {
  const vals = [];
  if (layer === 'accounts') {
    for (const v of Object.values(accountsByCountry)) {
      if (typeof v === 'number' && v > 0) vals.push(v);
    }
  } else if (layer === 'advisor') {
    for (const entry of Object.values(advisorByCountry)) {
      const tr = advisorTotalRuns(entry);
      if (tr != null) vals.push(tr);
    }
  } else {
    for (const iso of Object.keys(MOCK_STATS)) {
      const v = valueForCountry(iso, gameType, layer, accountsByCountry, advisorByCountry);
      if (v != null) vals.push(v);
    }
  }
  if (vals.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

function advisorHoverLines(stats, gameTypeKey) {
  const s = advisorStats(stats);
  if (!s || s.totalRuns < 1) return { title: null, lines: [] };
  const gameLine = GAME_LABELS[gameTypeKey] || 'All game types';
  const lines = [];
  if (s.distinctUsers > 0) {
    lines.push(
      `${s.distinctUsers} ${s.distinctUsers === 1 ? 'person' : 'people'} with accounts`,
    );
  }
  if (s.guestRuns > 0) {
    lines.push(`${s.guestRuns} guest ${s.guestRuns === 1 ? 'visit' : 'visits'} (not signed in)`);
  }
  if (lines.length === 0) {
    lines.push(`${s.totalRuns} ${s.totalRuns === 1 ? 'use' : 'uses'}`);
  }
  return { title: gameLine, lines };
}

export default function GlobalGamblingMap() {
  const [gameType, setGameType] = useState('lottery');
  const [layer, setLayer] = useState('advisor');
  const [accountsByCountry, setAccountsByCountry] = useState({});
  const [advisorByCountry, setAdvisorByCountry] = useState({});
  const [advisorMeta, setAdvisorMeta] = useState({ total: 0, updatedAt: null });
  const [viewer, setViewer] = useState(null);
  const [hover, setHover] = useState(null);
  const [toolPos, setToolPos] = useState({ x: 0, y: 0 });
  const [topology, setTopology] = useState(null);
  const [topologyError, setTopologyError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/map-topology');
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (!cancelled) {
          setTopology(json);
          setTopologyError(null);
        }
      } catch {
        if (!cancelled) {
          setTopology(null);
          setTopologyError('Could not load map outlines. Is the dev server running?');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, a] = await Promise.all([
          fetch('/api/geo/me', { credentials: 'include' }).then((r) => r.json()),
          fetch('/api/stats/map-accounts', { credentials: 'include' }).then((r) => r.json()),
        ]);
        if (!cancelled) {
          setViewer(g);
          setAccountsByCountry(a.byCountry || {});
        }
      } catch {
        if (!cancelled) {
          setViewer(null);
          setAccountsByCountry({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (layer !== 'advisor') return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        const q = gameType === 'all' ? '' : `?gameType=${encodeURIComponent(gameType)}`;
        const res = await fetch(`/api/stats/map-advisor${q}`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setAdvisorByCountry(data.byCountry || {});
        setAdvisorMeta({
          total: data.total ?? 0,
          updatedAt: data.updatedAt ?? null,
        });
      } catch {
        if (!cancelled) {
          setAdvisorByCountry({});
          setAdvisorMeta({ total: 0, updatedAt: null });
        }
      }
    };

    load();
    const id = setInterval(load, ADVISOR_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [layer, gameType]);

  const { min, max } = useMemo(
    () => extentValues(layer, gameType, accountsByCountry, advisorByCountry),
    [layer, gameType, accountsByCountry, advisorByCountry],
  );

  const colorScale = useMemo(() => {
    if (layer === 'advisor') {
      const hi = Math.max(max, 5);
      return scaleSqrt().domain([0, hi]).range(['#93c5fd', '#1e3a8a']).clamp(true);
    }
    const pad = max > min ? (max - min) * 0.05 : 1;
    return scaleLinear()
      .domain([min - pad, max + pad])
      .range(['#e2e8f0', '#1d4ed8'])
      .clamp(true);
  }, [layer, min, max]);

  const fillFor = useCallback(
    (iso) => {
      const v = valueForCountry(iso, gameType, layer, accountsByCountry, advisorByCountry);
      if (v == null || v < 1) return NO_DATA_FILL;
      return colorScale(v);
    },
    [gameType, layer, accountsByCountry, advisorByCountry, colorScale],
  );

  const onMove = useCallback((e) => {
    setToolPos({ x: e.clientX, y: e.clientY });
  }, []);

  const gameFilterDisabled = layer === 'accounts';
  const layerHint =
    layer === 'anonymous'
      ? 'Illustrative percentages — swap for real survey data later.'
      : layer === 'accounts'
        ? 'Counts from signups/logins where country was detected from IP (approximate).'
        : `Countries fill by total advisor uses on this filter; hover shows how many different accounts vs guests. Updates every ${ADVISOR_POLL_MS / 1000}s (${advisorMeta.total} runs in view).`;

  const formatHoverValue = (v) => {
    if (v == null) return 'No data';
    if (layer === 'accounts') return `${v} account(s)`;
    if (layer === 'advisor') return `${v} advisor run(s)`;
    return `${v.toFixed(1)}% index`;
  };

  return (
    <section
      style={{
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        background: '#fff',
        padding: '1.25rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'flex-end',
          marginBottom: '1rem',
        }}
      >
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>Data layer</span>
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
            style={{ padding: '0.45rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', minWidth: 260 }}
          >
            {Object.entries(LAYER_LABELS).map(([k, lab]) => (
              <option key={k} value={k}>
                {lab}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>Game filter</span>
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            disabled={gameFilterDisabled}
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              minWidth: 200,
              opacity: gameFilterDisabled ? 0.5 : 1,
            }}
          >
            {Object.entries(GAME_LABELS).map(([k, lab]) => (
              <option key={k} value={k}>
                {lab}
              </option>
            ))}
          </select>
        </label>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', maxWidth: 340, lineHeight: 1.4 }}>
          {layerHint}
        </p>
      </div>

      {layer === 'advisor' && advisorMeta.updatedAt && (
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
          Last fetched: {new Date(advisorMeta.updatedAt).toLocaleTimeString()}
        </p>
      )}

      {viewer?.countryCode && (
        <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
          Your detected region: <strong>{viewer.countryName || viewer.countryCode}</strong> (
          {viewer.countryCode}) — highlighted on the map.
        </p>
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '0.75rem',
          background: '#e2e8f0',
          border: '1px solid #94a3b8',
        }}
        onMouseMove={onMove}
      >
        {topologyError && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>{topologyError}</div>
        )}
        {!topology && !topologyError && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading map outlines…</div>
        )}
        {topology && (
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{
            scale: 168,
            center: [0, 12],
          }}
          width={980}
          height={520}
          style={{ width: '100%', height: 'auto', maxWidth: '100%', display: 'block' }}
        >
            <Geographies geography={topology}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const iso = isoFromGeo(geo);
                  const isYou = iso && viewer?.countryCode && iso === viewer.countryCode;
                  const hasAdvisor = layer === 'advisor' && advisorTotalRuns(advisorByCountry[iso]) != null;
                  const fill = fillFor(iso);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={isYou ? '#ca8a04' : hasAdvisor ? '#1e3a8a' : '#64748b'}
                      strokeWidth={isYou ? 1.35 : hasAdvisor ? 0.65 : 0.4}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: iso ? '#2563eb' : fill },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => {
                        if (!iso) return;
                        if (layer === 'advisor') {
                          setHover({
                            kind: 'advisor',
                            iso,
                            stats: advisorByCountry[iso],
                            gameType,
                          });
                          return;
                        }
                        const v = valueForCountry(iso, gameType, layer, accountsByCountry, advisorByCountry);
                        setHover({ kind: 'simple', iso, v });
                      }}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })
              }
            </Geographies>
        </ComposableMap>
        )}

        {hover?.iso && (
          <div
            style={{
              position: 'fixed',
              left: Math.min(toolPos.x + 12, typeof window !== 'undefined' ? window.innerWidth - 280 : 0),
              top: Math.min(toolPos.y + 12, typeof window !== 'undefined' ? window.innerHeight - 140 : 0),
              padding: '0.55rem 0.85rem',
              background: 'rgba(15,23,42,0.94)',
              color: '#f8fafc',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              zIndex: 50,
              maxWidth: 280,
              lineHeight: 1.45,
            }}
          >
            <strong style={{ fontSize: '0.9rem' }}>{hover.iso}</strong>
            {hover.kind === 'advisor' ? (
              (() => {
                const { title, lines } = advisorHoverLines(hover.stats, hover.gameType);
                if (!lines.length) {
                  return (
                    <div style={{ marginTop: 6, opacity: 0.85 }}>No data for this filter</div>
                  );
                }
                return (
                  <>
                    {lines.map((line, i) => (
                      <div key={i} style={{ marginTop: i === 0 ? 6 : 4 }}>
                        {line}
                      </div>
                    ))}
                    {title && (
                      <div style={{ marginTop: 8, opacity: 0.8, fontSize: '0.75rem' }}>
                        Filter: <strong>{title}</strong>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div style={{ marginTop: 6 }}>{formatHoverValue(hover.v)}</div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '0.85rem',
          fontSize: '0.75rem',
          color: '#64748b',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span style={{ width: 48, height: 8, background: 'linear-gradient(90deg,#f1f5f9,#1d4ed8)', borderRadius: 4 }} />
          {layer === 'anonymous' ? 'Low → high %' : layer === 'advisor' ? 'Uses (sqrt scale)' : 'Low → high count'}
        </span>
        <span>
          {layer === 'advisor'
            ? 'Darker blue = more uses; navy outline = at least one use on this filter.'
            : 'Gold border = your IP region (when detectable).'}
        </span>
      </div>
    </section>
  );
}
