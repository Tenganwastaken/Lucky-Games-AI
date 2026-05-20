'use client';

import { buildChartAriaSummary } from '@/lib/chart-a11y';

/**
 * Wraps a chart with aria-label summary and visually hidden data table.
 */
export default function AccessibleChart({
  title,
  chartData,
  valueSuffix,
  height = 260,
  children,
}) {
  const summary = buildChartAriaSummary(
    { ...chartData, title },
    { valueSuffix },
  );
  const labels = chartData?.labels ?? [];
  const values = chartData?.datasets?.[0]?.data ?? [];
  const seriesLabel = chartData?.datasets?.[0]?.label ?? 'Τιμή';

  return (
    <figure className="accessible-chart" style={{ height, margin: 0 }}>
      <div
        className="accessible-chart__canvas"
        role="img"
        aria-label={summary}
        style={{ height: '100%' }}
      >
        {children}
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
      {labels.length > 0 ? (
        <table className="sr-only accessible-chart__table">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Κατηγορία</th>
              <th scope="col">{seriesLabel}</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>
                  {values[i]}
                  {valueSuffix ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </figure>
  );
}
