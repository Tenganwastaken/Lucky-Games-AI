/**
 * Build a concise Greek summary for screen readers from chart.js-style data.
 * @param {{ title?: string, labels?: string[], datasets?: { label?: string, data?: number[] }[] }} chartData
 * @param {{ valueSuffix?: string }} [opts]
 */
export function buildChartAriaSummary(chartData, opts = {}) {
  const suffix = opts.valueSuffix ?? '';
  const title = chartData?.title ? `${chartData.title}. ` : '';
  const labels = chartData?.labels ?? [];
  const dataset = chartData?.datasets?.[0];
  const values = dataset?.data ?? [];
  const seriesLabel = dataset?.label ? `${dataset.label}: ` : '';

  if (!labels.length || !values.length) {
    return `${title}${seriesLabel}Δεν υπάρχουν διαθέσιμα δεδομένα.`;
  }

  const pairs = labels.map((label, i) => {
    const v = values[i];
    const formatted =
      typeof v === 'number'
        ? Number.isInteger(v)
          ? String(v)
          : v.toLocaleString('el-GR', { maximumFractionDigits: 1 })
        : String(v ?? '—');
    return `${label} ${formatted}${suffix}`;
  });

  return `${title}${seriesLabel}${pairs.join('; ')}.`;
}

/** @param {string} [tierColor] */
export function riskTierTextLabel(tierColor) {
  switch (tierColor) {
    case 'green':
      return 'Χαμηλός κίνδυνος';
    case 'yellow':
      return 'Μέτριος κίνδυνος';
    case 'orange':
      return 'Υψηλός κίνδυνος';
    case 'red':
      return 'Πολύ υψηλός κίνδυνος';
    default:
      return 'Επίπεδο κινδύνου';
  }
}
