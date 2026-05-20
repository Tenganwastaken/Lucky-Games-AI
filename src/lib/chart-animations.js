/** Shared Chart.js entry animations (respects reduced motion via Chart defaults). */

const BAR_ENTRY = {
  duration: 400,
  easing: 'easeOutCubic',
  delay: (ctx) => (ctx.type === 'data' ? ctx.dataIndex * 50 : 0),
};

const LINE_ENTRY = {
  duration: 800,
  easing: 'easeOutCubic',
};

const PIE_ENTRY = {
  duration: 800,
  easing: 'easeOutCubic',
  animateRotate: true,
  animateScale: true,
};

/**
 * @param {import('chart.js').ChartOptions} options
 * @returns {import('chart.js').ChartOptions}
 */
export function withBarEntryAnimation(options = {}) {
  return {
    ...options,
    animation: { ...options.animation, ...BAR_ENTRY },
  };
}

/**
 * @param {import('chart.js').ChartOptions} options
 * @returns {import('chart.js').ChartOptions}
 */
export function withLineEntryAnimation(options = {}) {
  return {
    ...options,
    animation: { ...options.animation, ...LINE_ENTRY },
    animations: {
      ...options.animations,
      x: {
        type: 'number',
        easing: 'easeOutCubic',
        duration: 800,
        from: NaN,
        ...(options.animations?.x || {}),
      },
      y: {
        type: 'number',
        easing: 'easeOutCubic',
        duration: 800,
        from: (ctx) => ctx.chart.scales.y?.getPixelForValue?.(0) ?? 0,
        ...(options.animations?.y || {}),
      },
    },
  };
}

/**
 * @param {import('chart.js').ChartOptions} options
 * @returns {import('chart.js').ChartOptions}
 */
export function withPieEntryAnimation(options = {}) {
  return {
    ...options,
    animation: { ...options.animation, ...PIE_ENTRY },
  };
}
