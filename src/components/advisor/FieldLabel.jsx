'use client';

import InfoTooltip from '@/components/InfoTooltip';
import { FIELD_TOOLTIPS } from '@/lib/advisor-field-tooltips';

/**
 * Label row with optional field tooltip.
 * @param {{ children: import('react').ReactNode, fieldKey?: string }} props
 */
export default function FieldLabel({ children, fieldKey }) {
  const tip = fieldKey ? FIELD_TOOLTIPS[fieldKey] : null;
  return (
    <span className="field-label-with-info">
      <span className="field-label-with-info__text">{children}</span>
      {tip ? (
        <InfoTooltip title={tip.title} body={tip.body} source={tip.source} />
      ) : null}
    </span>
  );
}
