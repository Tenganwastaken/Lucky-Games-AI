import {
  PRIMARY_GAME_TYPE_OPTIONS,
  WAGER_VARIABILITY_OPTIONS,
  CHASING_FREQUENCY_OPTIONS,
  CANCEL_WITHDRAWAL_OPTIONS,
  LIMITS_SET_OPTIONS,
  FAILED_STOP_OPTIONS,
  RELATIONSHIP_CONFLICT_OPTIONS,
  RISK_AWARENESS_OPTIONS,
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
} from '@/lib/risk-assessment-form';
import { GAME_TYPE_LABELS, RISK_TOLERANCE_LABELS } from '@/lib/strings';

export { GAME_TYPE_LABELS, RISK_TOLERANCE_LABELS };

function labelFrom(options, value) {
  if (!value) return '—';
  const hit = options.find((o) => o.value === value);
  return hit?.label ?? value;
}

export function primaryGameTypeLabel(value) {
  return labelFrom(PRIMARY_GAME_TYPE_OPTIONS, value);
}

export function gameTypeLabel(value) {
  if (PRIMARY_GAME_TYPE_OPTIONS.some((o) => o.value === value)) {
    return primaryGameTypeLabel(value);
  }
  return GAME_TYPE_LABELS[value] ?? value;
}

export function riskToleranceLabel(value) {
  return RISK_TOLERANCE_LABELS[value] ?? value;
}

export function ageRangeLabel(value) {
  return labelFrom(AGE_RANGE_OPTIONS, value);
}

export function genderLabel(value) {
  return labelFrom(GENDER_OPTIONS, value);
}

export function wagerVariabilityLabel(value) {
  return labelFrom(WAGER_VARIABILITY_OPTIONS, value);
}

export function chasingFrequencyLabel(value) {
  return labelFrom(CHASING_FREQUENCY_OPTIONS, value);
}

export function cancelWithdrawalLabel(value) {
  return labelFrom(CANCEL_WITHDRAWAL_OPTIONS, value);
}

export function limitsSetLabel(value) {
  return labelFrom(LIMITS_SET_OPTIONS, value);
}

export function failedStopLabel(value) {
  return labelFrom(FAILED_STOP_OPTIONS, value);
}

export function relationshipConflictLabel(value) {
  return labelFrom(RELATIONSHIP_CONFLICT_OPTIONS, value);
}

export function riskAwarenessLabel(value) {
  return labelFrom(RISK_AWARENESS_OPTIONS, value);
}
