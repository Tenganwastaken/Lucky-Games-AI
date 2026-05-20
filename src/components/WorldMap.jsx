'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { drag } from 'd3-drag';
import {
  geoEqualEarth,
  geoGraticule,
  geoOrthographic,
  geoPath,
  geoCentroid,
} from 'd3-geo';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { feature } from 'topojson-client';
import CountryDeepDive from '@/components/CountryDeepDive';
import MapTooltip from '@/components/MapTooltip';
import { flagEmoji, getCountryProfile } from '@/data/countries';
import { prevalencePercent, problemGamblingPercent } from '@/data/mockMapLayers';
import { isoFromRsmGeography as isoFromGeo } from '@/lib/map-iso';
import {
  MAP_CLICK_COUNTRY_HINT,
  MAP_GLOBE_FLAT,
  MAP_GLOBE_GLOBE,
  MAP_LAYER_LABELS_VIZ,
  MAP_LAYER_VALUE_PREVALENCE,
  MAP_LAYER_VALUE_PROBLEM,
  MAP_LAYER_VALUE_RISK,
  MAP_LEGEND_SOURCE,
  MAP_LOAD_ERROR,
  MAP_NO_DATA,
  MAP_RESET_VIEW,
  MAP_WORLD_ARIA,
  MAP_YOUR_REGION,
  MAP_HIGHLIGHTED,
} from '@/lib/strings';

const ASPECT = 520 / 980;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

const LAYERS = ['prevalence', 'risk', 'problem'];

function sortFeaturesForKeyboard(features) {
  const withIso = features
    .map((f) => ({ f, iso: isoFromGeo(f) }))
    .filter((x) => x.iso);
  const gr = withIso.find((x) => x.iso === 'GR');
  const rest = withIso.filter((x) => x.iso !== 'GR').sort((a, b) => a.iso.localeCompare(b.iso));
  return gr ? [gr, ...rest] : rest;
}

function layerValue(iso, layer, riskByCountry) {
  if (!iso) return null;
  if (layer === 'prevalence') return prevalencePercent(iso);
  if (layer === 'problem') return problemGamblingPercent(iso);
  const row = riskByCountry[iso];
  return row?.meanRisk ?? null;
}

function layerHasData(v, layer) {
  if (v == null) return false;
  if (layer === 'risk') return v > 0;
  return v > 0;
}

function formatLayerValue(v, layer) {
  if (v == null) return MAP_NO_DATA;
  if (layer === 'risk') return `${v.toFixed(1)} / 100`;
  return `${v.toFixed(1)}%`;
}

function legendMeta(layer, scales) {
  if (layer === 'prevalence') {
    return {
      title: MAP_LAYER_LABELS_VIZ.prevalence,
      domain: [0, 40, 80],
      interpolate: scales.prevalenceScale,
    };
  }
  if (layer === 'problem') {
    return {
      title: MAP_LAYER_LABELS_VIZ.problem,
      domain: [0, 50, 100],
      interpolate: scales.problemScale,
    };
  }
  return {
    title: MAP_LAYER_LABELS_VIZ.risk,
    domain: [0, 50, 100],
    interpolate: scales.riskScale,
  };
}

export default function WorldMap() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const zoomLayerRef = useRef(null);
  const rotateRef = useRef(0);
  const pauseRotateRef = useRef(false);
  const rafRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const pathsRef = useRef(null);
  const lastTapRef = useRef({ iso: null, t: 0 });

  const [size, setSize] = useState({ width: 980, height: 520 });
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState('flat');
  const [layer, setLayer] = useState('prevalence');
  const [topology, setTopology] = useState(null);
  const [topologyError, setTopologyError] = useState(null);
  const [riskByCountry, setRiskByCountry] = useState({});
  const [viewer, setViewer] = useState(null);
  const [chromatic, setChromatic] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [waveDone, setWaveDone] = useState(false);

  const [hoverIso, setHoverIso] = useState(null);
  const [toolPos, setToolPos] = useState({ x: 0, y: 0 });
  const [deepDiveIso, setDeepDiveIso] = useState(null);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    import('d3-scale-chromatic').then((mod) => {
      import('d3-scale').then(({ scaleSequential }) => {
        setChromatic({
          prevalenceScale: scaleSequential(mod.interpolateBlues).domain([0, 80]),
          riskScale: scaleSequential(mod.interpolateOranges).domain([0, 100]),
          problemScale: scaleSequential(mod.interpolateOrRd).domain([0, 100]),
        });
      });
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = Math.max(320, Math.floor(entries[0].contentRect.width));
      setSize({ width: w, height: Math.round(w * ASPECT) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = isMobile ? '50' : '110';
        const res = await fetch(`/api/map-topology?detail=${detail}`);
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (!cancelled) {
          setTopology(json);
          setTopologyError(null);
          setWaveDone(false);
        }
      } catch {
        if (!cancelled) {
          setTopology(null);
          setTopologyError(MAP_LOAD_ERROR);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [geoRes, riskRes] = await Promise.all([
          fetch('/api/geo/me', { credentials: 'include' }).then((r) => r.json()),
          fetch('/api/stats/map-risk', { credentials: 'include' }).then((r) => r.json()),
        ]);
        if (!cancelled) {
          setViewer(geoRes);
          setRiskByCountry(riskRes.byCountry || {});
        }
      } catch {
        if (!cancelled) {
          setViewer(null);
          setRiskByCountry({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const geographyFeatures = useMemo(() => {
    if (!topology?.objects?.countries) return [];
    try {
      return feature(topology, topology.objects.countries).features;
    } catch {
      return [];
    }
  }, [topology]);

  const keyboardOrder = useMemo(
    () => sortFeaturesForKeyboard(geographyFeatures),
    [geographyFeatures],
  );

  const getFill = useCallback(
    (iso) => {
      if (!chromatic || !iso) return 'var(--map-land-base)';
      const v = layerValue(iso, layer, riskByCountry);
      if (!layerHasData(v, layer)) return 'var(--map-no-data)';
      if (layer === 'prevalence') return chromatic.prevalenceScale(v);
      if (layer === 'problem') return chromatic.problemScale(v);
      return chromatic.riskScale(v);
    },
    [chromatic, layer, riskByCountry],
  );

  const openCountry = useCallback((iso) => {
    if (!iso) return;
    const path = pathsRef.current?.filter((d) => isoFromGeo(d) === iso);
    if (path?.size()) {
      path
        .transition()
        .duration(150)
        .attr('stroke-width', 2.5)
        .attr('stroke', 'var(--color-accent)')
        .transition()
        .duration(150)
        .attr('stroke-width', 0.5)
        .on('end', () => setDeepDiveIso(iso));
    } else {
      setDeepDiveIso(iso);
    }
  }, []);

  const renderMap = useCallback(() => {
    const svg = select(svgRef.current);
    const gZoom = select(zoomLayerRef.current);
    if (!svg.node() || !gZoom.node() || !geographyFeatures.length) return;

    const { width, height } = size;
    const isGlobe = viewMode === 'globe';

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    let projection;
    if (isGlobe) {
      const scale = Math.min(width, height) / 2.15;
      projection = geoOrthographic()
        .scale(scale)
        .translate([width / 2, height / 2])
        .rotate([rotateRef.current, -12, 0])
        .clipAngle(90);
    } else {
      projection = geoEqualEarth();
      projection.fitSize([width, height], {
        type: 'FeatureCollection',
        features: geographyFeatures,
      });
    }

    const path = geoPath(projection);
    const graticule = geoGraticule().step([20, 20]);

    svg.selectAll('defs').remove();
    gZoom.selectAll('*').remove();

    const defs = svg.append('defs');
    const oceanGrad = defs
      .append('radialGradient')
      .attr('id', 'map-ocean-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', 'var(--map-ocean)');
    oceanGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'var(--bg-base)');

    const root = gZoom.append('g').attr('class', 'map-zoom-root');

    if (isGlobe) {
      root
        .append('circle')
        .attr('class', 'map-sphere-ocean')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale())
        .attr('fill', 'url(#map-ocean-gradient)');

      root
        .append('circle')
        .attr('class', 'map-sphere-glow')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale())
        .attr('fill', 'none')
        .attr('stroke', 'var(--border-subtle)')
        .attr('stroke-width', 1.2);
    } else {
      root
        .append('rect')
        .attr('class', 'map-ocean-flat')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'var(--map-ocean)');
    }

    root
      .append('path')
      .datum(graticule())
      .attr('class', 'map-graticule')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', 'var(--border-subtle)')
      .attr('stroke-width', 0.3)
      .attr('pointer-events', 'none');

    const countries = root
      .selectAll('.map-country')
      .data(geographyFeatures, (d, i) => isoFromGeo(d) || `f-${i}`)
      .join('path')
      .attr('class', 'map-country-path')
      .attr('d', path)
      .attr('fill', (d) => getFill(isoFromGeo(d)))
      .attr('stroke', (d) => {
        const iso = isoFromGeo(d);
        if (iso && viewer?.countryCode && iso === viewer.countryCode) return 'var(--map-stroke-you)';
        return 'var(--map-stroke)';
      })
      .attr('stroke-width', (d) => {
        const iso = isoFromGeo(d);
        if (iso && viewer?.countryCode && iso === viewer.countryCode) return 1.35;
        return 0.5;
      })
      .style('cursor', (d) => (isoFromGeo(d) ? 'pointer' : 'default'))
      .attr('tabindex', (d) => (isoFromGeo(d) ? 0 : null))
      .attr('role', (d) => (isoFromGeo(d) ? 'button' : null))
      .attr('aria-label', (d) => {
        const iso = isoFromGeo(d);
        if (!iso) return null;
        const name = getCountryProfile(iso).name;
        const v = layerValue(iso, layer, riskByCountry);
        return `${name}, ${formatLayerValue(v, layer)}`;
      })
      .attr('opacity', waveDone ? 1 : 0)
      .each(function eachTitle(d) {
        const iso = isoFromGeo(d);
        if (!iso) return;
        const title = select(this).selectAll('title').data([0]);
        title.join('title').text(() => {
          const name = getCountryProfile(iso).name;
          const v = layerValue(iso, layer, riskByCountry);
          return `${name}: ${formatLayerValue(v, layer)}`;
        });
      });

    pathsRef.current = countries;

    const accentStroke = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() ||
      'var(--color-accent)';

    countries
      .on('mouseenter', function onEnter(event, d) {
        const iso = isoFromGeo(d);
        if (!iso) return;
        pauseRotateRef.current = true;
        setHoverIso(iso);
        select(this)
          .raise()
          .transition()
          .duration(200)
          .attr('stroke', accentStroke())
          .attr('stroke-width', 1.5)
          .style('filter', 'brightness(1.1) saturate(1.2)');
      })
      .on('mousemove', (event) => {
        setToolPos({ x: event.clientX, y: event.clientY });
      })
      .on('mouseleave', function onLeave() {
        pauseRotateRef.current = false;
        setHoverIso(null);
        select(this)
          .transition()
          .duration(200)
          .attr('stroke', (d) => {
            const iso = isoFromGeo(d);
            if (iso && viewer?.countryCode && iso === viewer.countryCode) return 'var(--map-stroke-you)';
            return 'var(--map-stroke)';
          })
          .attr('stroke-width', (d) => {
            const iso = isoFromGeo(d);
            if (iso && viewer?.countryCode && iso === viewer.countryCode) return 1.35;
            return 0.5;
          })
          .style('filter', null);
      })
      .on('click', (event, d) => {
        const iso = isoFromGeo(d);
        if (!iso) return;
        event.stopPropagation();
        openCountry(iso);
      })
      .on('touchstart', (event, d) => {
        const iso = isoFromGeo(d);
        if (!iso) return;
        const touch = event.touches?.[0];
        if (touch) setToolPos({ x: touch.clientX, y: touch.clientY });
        setHoverIso(iso);
        pauseRotateRef.current = true;
      })
      .on('touchend', (event, d) => {
        const iso = isoFromGeo(d);
        if (!iso) return;
        const now = Date.now();
        if (lastTapRef.current.iso === iso && now - lastTapRef.current.t < 320) {
          event.preventDefault();
          openCountry(iso);
        }
        lastTapRef.current = { iso, t: now };
      });

    if (!waveDone) {
      countries
        .transition()
        .duration(400)
        .delay((d) => {
          const c = geoCentroid(d);
          const lon = c[0];
          return Math.max(0, (lon + 180) * 2);
        })
        .attr('opacity', 1)
        .on('end', () => setWaveDone(true));
    }

    if (isGlobe) {
      const dragBehavior = drag()
        .on('drag', (event) => {
          const k = 120 / projection.scale();
          const r = projection.rotate();
          rotateRef.current = r[0] + event.dx * k;
          projection.rotate([rotateRef.current, r[1] - event.dy * k, r[2]]);
          root.selectAll('.map-country-path').attr('d', path);
          root.select('.map-graticule').attr('d', path);
          root.select('.map-sphere-ocean').attr('r', projection.scale());
          root.select('.map-sphere-glow').attr('r', projection.scale());
        });
      gZoom.call(dragBehavior);
      select(svgRef.current).on('.zoom', null);
    } else {
      gZoom.on('.drag', null);
    }

    setMapReady(true);
  }, [
    geographyFeatures,
    size,
    viewMode,
    layer,
    riskByCountry,
    getFill,
    viewer,
    waveDone,
    openCountry,
  ]);

  useEffect(() => {
    if (!topology || !chromatic) return;
    renderMap();
  }, [topology, chromatic, renderMap]);

  useEffect(() => {
    if (!mapReady || !pathsRef.current) return;
    const grNode = pathsRef.current.filter((d) => isoFromGeo(d) === 'GR').node();
    grNode?.focus({ preventScroll: true });
  }, [mapReady]);

  useEffect(() => {
    if (!pathsRef.current || !chromatic) return;
    pathsRef.current
      .transition()
      .duration(1000)
      .attr('fill', (d) => getFill(isoFromGeo(d)));
  }, [layer, getFill, chromatic]);

  useEffect(() => {
    if (viewMode !== 'globe' || !mapReady) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return undefined;
    }
    const tick = () => {
      if (!pauseRotateRef.current && svgRef.current) {
        rotateRef.current += 0.15;
        const svg = select(svgRef.current);
        const g = svg.select('.map-zoom-root');
        const width = size.width;
        const height = size.height;
        const scale = Math.min(width, height) / 2.15;
        const projection = geoOrthographic()
          .scale(scale)
          .translate([width / 2, height / 2])
          .rotate([rotateRef.current, -12, 0])
          .clipAngle(90);
        const path = geoPath(projection);
        g.selectAll('.map-country-path').attr('d', path);
        g.select('.map-graticule').attr('d', path);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [viewMode, mapReady, size]);

  useEffect(() => {
    if (viewMode !== 'flat' || !svgRef.current || !mapReady) return undefined;
    const svg = select(svgRef.current);
    const { width, height } = size;
    const behavior = d3Zoom()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .translateExtent([
        [-width, -height],
        [width * 2, height * 2],
      ])
      .on('zoom', (event) => {
        select(zoomLayerRef.current).attr('transform', event.transform);
      });
    zoomBehaviorRef.current = behavior;
    svg.call(behavior);
    return () => {
      svg.on('.zoom', null);
    };
  }, [viewMode, size, mapReady]);

  const resetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(300)
      .ease((t) => 1 - (1 - t) ** 3)
      .call(zoomBehaviorRef.current.transform, zoomIdentity);
  };

  const toggleView = () => {
    setViewMode((m) => (m === 'flat' ? 'globe' : 'flat'));
    rotateRef.current = 0;
    setWaveDone(true);
  };

  const tooltipData = useMemo(() => {
    if (!hoverIso) return null;
    const profile = getCountryProfile(hoverIso);
    const v = layerValue(hoverIso, layer, riskByCountry);
    const valueLabels = {
      prevalence: MAP_LAYER_VALUE_PREVALENCE,
      risk: MAP_LAYER_VALUE_RISK,
      problem: MAP_LAYER_VALUE_PROBLEM,
    };
    return {
      flag: flagEmoji(hoverIso),
      countryName: profile.name,
      valueLabel: valueLabels[layer],
      valueText: formatLayerValue(v, layer),
      sparkline: layer === 'risk' ? riskByCountry[hoverIso]?.sparkline : undefined,
    };
  }, [hoverIso, layer, riskByCountry]);

  const legend = chromatic ? legendMeta(layer, chromatic) : null;

  const onContainerKeyDown = (e) => {
    if (!keyboardOrder.length) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const next = e.shiftKey
        ? (focusIdx - 1 + keyboardOrder.length) % keyboardOrder.length
        : (focusIdx + 1) % keyboardOrder.length;
      setFocusIdx(next);
      const iso = keyboardOrder[next].iso;
      setHoverIso(iso);
      pathsRef.current?.filter((d) => isoFromGeo(d) === iso).node()?.focus();
    }
    if (e.key === 'Enter' && hoverIso) {
      e.preventDefault();
      openCountry(hoverIso);
    }
  };

  return (
    <section className="map-panel map-panel--pad" aria-label={MAP_WORLD_ARIA}>
      <div className="map-container" ref={containerRef} onKeyDown={onContainerKeyDown}>
        <div className="map-controls map-controls--top-left">
          {LAYERS.map((key) => (
            <button
              key={key}
              type="button"
              className={`map-control-btn${layer === key ? ' map-control-btn--active' : ''}`}
              onClick={() => setLayer(key)}
              aria-pressed={layer === key}
            >
              {MAP_LAYER_LABELS_VIZ[key]}
            </button>
          ))}
        </div>

        <div className="map-controls map-controls--top-right">
          {viewMode === 'flat' ? (
            <button type="button" className="map-control-btn" onClick={resetZoom} title={MAP_RESET_VIEW}>
              🏠
            </button>
          ) : null}
          <button type="button" className="map-control-btn map-control-btn--primary" onClick={toggleView}>
            {viewMode === 'flat' ? MAP_GLOBE_GLOBE : MAP_GLOBE_FLAT}
          </button>
        </div>

        {legend && chromatic ? (
          <div className="map-legend-card">
            <p className="map-legend-card__title">{legend.title}</p>
            <div
              className="map-legend-card__bar"
              style={{
                background: `linear-gradient(90deg, ${legend.interpolate(legend.domain[0])}, ${legend.interpolate(legend.domain[2])})`,
              }}
              role="img"
              aria-hidden
            />
            <div className="map-legend-card__axis">
              <span>{legend.domain[0]}</span>
              <span>{legend.domain[1]}</span>
              <span>{legend.domain[2]}</span>
            </div>
            <p className="map-legend-card__source">{MAP_LEGEND_SOURCE}</p>
          </div>
        ) : null}

        {viewer?.countryCode ? (
          <p className="map-viewer-hint">
            {MAP_YOUR_REGION} <strong>{viewer.countryName || viewer.countryCode}</strong> (
            {viewer.countryCode}) {MAP_HIGHLIGHTED}
          </p>
        ) : null}

        <div className="map-svg-wrap">
          {topologyError ? (
            <p className="map-error">{topologyError}</p>
          ) : (
            <svg
              ref={svgRef}
              className={`map-svg${mapReady ? ' map-svg--ready' : ''}`}
              role="img"
              aria-label={MAP_WORLD_ARIA}
            >
              <g ref={zoomLayerRef} />
            </svg>
          )}
        </div>

        <MapTooltip
          open={Boolean(hoverIso && tooltipData)}
          clientX={toolPos.x}
          clientY={toolPos.y}
          {...(tooltipData || {
            flag: '',
            countryName: '',
            valueLabel: '',
            valueText: '',
          })}
        />
      </div>

      <p className="map-click-hint">{MAP_CLICK_COUNTRY_HINT}</p>

      <CountryDeepDive
        iso={deepDiveIso}
        open={Boolean(deepDiveIso)}
        onClose={() => setDeepDiveIso(null)}
      />
    </section>
  );
}
