/** Theme init — inline in layout <head> to avoid flash */
export const THEME_INIT_SCRIPT = `(function(){try{var k='theme';var s=localStorage.getItem(k);var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export const THEME_STORAGE_KEY = 'theme';

export function readCssVar(name, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function getResolvedTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
}

export function toggleTheme() {
  const next = getResolvedTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function getChartTheme() {
  return {
    foreground: readCssVar('--foreground', 'var(--fg-primary)'),
    textSecondary: readCssVar('--text-secondary', 'var(--fg-secondary)'),
    textMuted: readCssVar('--text-muted', 'var(--fg-tertiary)'),
    border: readCssVar('--border', 'var(--border-default)'),
    bar1: readCssVar('--chart-bar-1', 'var(--fg-secondary)'),
    bar2: readCssVar('--chart-bar-2', 'var(--fg-tertiary)'),
    bar3: readCssVar('--chart-bar-3', 'var(--color-accent)'),
    barMuted: readCssVar('--chart-bar-muted', 'var(--border-strong)'),
    accent: readCssVar('--chart-accent', 'var(--color-accent)'),
    limitLine: readCssVar('--error', 'var(--color-risk-critical)'),
  };
}

/** @param {ReturnType<typeof getChartTheme>} t */
export function chartBaseOptions(t, title) {
  return {
    responsive: true,
    animation: {
      duration: 400,
      easing: 'easeOutCubic',
      delay: (ctx) => (ctx.type === 'data' ? ctx.dataIndex * 50 : 0),
    },
    plugins: {
      legend: { position: 'top', labels: { color: t.textSecondary } },
      title: title
        ? { display: true, text: title, color: t.foreground, font: { size: 14 } }
        : undefined,
    },
    scales: {
      x: { ticks: { color: t.textMuted }, grid: { color: t.border } },
      y: { ticks: { color: t.textMuted }, grid: { color: t.border } },
    },
  };
}

export function getMapTheme() {
  return {
    noData: readCssVar('--map-no-data', 'var(--map-land-base)'),
    scaleLow: readCssVar('--map-scale-low', 'var(--map-ocean)'),
    scaleHigh: readCssVar('--map-scale-high', 'var(--fg-secondary)'),
    hover: readCssVar('--map-hover', 'var(--map-land-hover)'),
    stroke: readCssVar('--map-stroke', 'var(--map-stroke)'),
    strokeAdvisor: readCssVar('--map-stroke-advisor', 'var(--color-accent)'),
    strokeYou: readCssVar('--map-stroke-you', 'var(--color-risk-medium)'),
    tooltipBg: readCssVar('--map-tooltip-bg', 'var(--map-tooltip-bg)'),
    tooltipText: readCssVar('--map-tooltip-text', 'var(--fg-on-accent)'),
  };
}
