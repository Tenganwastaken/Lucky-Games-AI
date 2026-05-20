import {
  PREFER_NOT,
  NO_PREFER_NOT_FIELDS,
  PRIMARY_GAME_TYPE_OPTIONS,
  WAGER_VARIABILITY_OPTIONS,
  CHASING_FREQUENCY_OPTIONS,
  CANCEL_WITHDRAWAL_OPTIONS,
  LIMITS_SET_OPTIONS,
  FAILED_STOP_OPTIONS,
  RELATIONSHIP_CONFLICT_OPTIONS,
  RISK_AWARENESS_OPTIONS,
} from '@/lib/risk-assessment-form';

const SET = (opts) => new Set(opts.map((o) => o.value));

const PRIMARY = SET(PRIMARY_GAME_TYPE_OPTIONS);
const WAGER_VAR = SET(WAGER_VARIABILITY_OPTIONS);
const CHASING = SET(CHASING_FREQUENCY_OPTIONS);
const CANCEL_WD = SET(CANCEL_WITHDRAWAL_OPTIONS);
const LIMITS = SET(LIMITS_SET_OPTIONS);
const FAILED_STOP = SET(FAILED_STOP_OPTIONS);
const RELATIONSHIP = SET(RELATIONSHIP_CONFLICT_OPTIONS);
const AWARENESS = SET(RISK_AWARENESS_OPTIONS);

function isEmpty(v) {
  return v === '' || v === null || v === undefined;
}

function acceptRadio(value, allowed, field) {
  if (isEmpty(value)) return `Το πεδίο ${field} είναι υποχρεωτικό.`;
  if (value === PREFER_NOT && NO_PREFER_NOT_FIELDS.has(field)) {
    return `Το πεδίο ${field} απαιτεί απάντηση.`;
  }
  if (value === PREFER_NOT) return null;
  if (!allowed.has(value)) return `Μη έγκυρη τιμή για ${field}.`;
  return null;
}

/**
 * @param {Record<string, unknown>} formData
 * @param {number} [upToSection] validate sections 2..upToSection (default 6)
 */
export function validateRiskAssessment(formData, upToSection = 6) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (upToSection >= 2) {
    const gtErr = acceptRadio(formData.primaryGameType, PRIMARY, 'primaryGameType');
    if (gtErr) errors.primaryGameType = gtErr;

    if (formData.gameTypesCount === PREFER_NOT) {
      /* allowed */
    } else if (isEmpty(formData.gameTypesCount)) {
      errors.gameTypesCount = 'Επίλεξε αριθμό τύπων παιχνιδιών (1–8) ή «Δεν θέλω να απαντήσω».';
    } else {
      const gtc = Number(formData.gameTypesCount);
      if (!Number.isFinite(gtc) || gtc < 1 || gtc > 8) {
        errors.gameTypesCount = 'Επίλεξε αριθμό τύπων παιχνιδιών από 1 έως 8.';
      }
    }
  }

  if (upToSection >= 3) {
    if (formData.daysPerMonth === PREFER_NOT) {
      errors.daysPerMonth = 'Απαιτείται εκτίμηση ημερών παιχνιδιού τον μήνα.';
    } else {
      const d = Number(formData.daysPerMonth);
      if (!Number.isFinite(d) || d < 0 || d > 30) {
        errors.daysPerMonth = 'Οι ημέρες πρέπει να είναι μεταξύ 0 και 30.';
      }
    }

    if (formData.avgSessionMinutes === PREFER_NOT) {
      /* ok */
    } else {
      const m = Number(formData.avgSessionMinutes);
      if (!Number.isFinite(m) || m < 5 || m > 360) {
        errors.avgSessionMinutes = 'Η διάρκεια συνεδρίας πρέπει να είναι 5–360 λεπτά.';
      }
    }

    if (formData.nightPlayPercent === PREFER_NOT) {
      /* ok */
    } else {
      const n = Number(formData.nightPlayPercent);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        errors.nightPlayPercent = 'Το ποσοστό πρέπει να είναι 0–100%.';
      }
    }
  }

  if (upToSection >= 4) {
    if (formData.avgWagerEuro === PREFER_NOT) {
      errors.avgWagerEuro = 'Απαιτείται μέσο μέγεθος στοιχήματος.';
    } else {
      const w = Number(formData.avgWagerEuro);
      if (!Number.isFinite(w) || w < 0) {
        errors.avgWagerEuro = 'Εισήγαγε έγκυρο ποσό σε €.';
      }
    }

    if (formData.weeklyTotalEuro === PREFER_NOT) {
      /* ok */
    } else if (!isEmpty(formData.weeklyTotalEuro)) {
      const wt = Number(formData.weeklyTotalEuro);
      if (!Number.isFinite(wt) || wt < 0) {
        errors.weeklyTotalEuro = 'Εισήγαγε έγκυρο εβδομαδιαίο ποσό.';
      }
    } else {
      errors.weeklyTotalEuro = 'Το εβδομαδιαίο ποσό είναι υποχρεωτικό (ή «Δεν θέλω να απαντήσω»).';
    }

    const wvErr = acceptRadio(formData.wagerVariability, WAGER_VAR, 'wagerVariability');
    if (wvErr) errors.wagerVariability = wvErr;
  }

  if (upToSection >= 5) {
    if (formData.depositsPerSession === PREFER_NOT) {
      /* ok */
    } else {
      const d = Number(formData.depositsPerSession);
      if (!Number.isFinite(d) || d < 0 || d > 20) {
        errors.depositsPerSession = 'Ο αριθμός καταθέσεων πρέπει να είναι 0–20.';
      }
    }

    const chErr = acceptRadio(formData.chasingFrequency, CHASING, 'chasingFrequency');
    if (chErr) errors.chasingFrequency = chErr;

    const cwErr = acceptRadio(
      formData.cancelWithdrawalCount,
      CANCEL_WD,
      'cancelWithdrawalCount',
    );
    if (cwErr) errors.cancelWithdrawalCount = cwErr;
  }

  if (upToSection >= 6) {
    const lsErr = acceptRadio(formData.limitsSet, LIMITS, 'limitsSet');
    if (lsErr) errors.limitsSet = lsErr;

    const fsErr = acceptRadio(formData.failedStopAttempts, FAILED_STOP, 'failedStopAttempts');
    if (fsErr) errors.failedStopAttempts = fsErr;

    const rcErr = acceptRadio(
      formData.relationshipConflict,
      RELATIONSHIP,
      'relationshipConflict',
    );
    if (rcErr) errors.relationshipConflict = rcErr;

    const raErr = acceptRadio(formData.riskAwareness, AWARENESS, 'riskAwareness');
    if (raErr) errors.riskAwareness = raErr;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Normalize client payload for API / DB */
export function normalizeRiskPayload(formData) {
  const num = (v, fallback = null) => {
    if (v === PREFER_NOT || v === '' || v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const str = (v) => (v === PREFER_NOT || v === '' || v == null ? null : String(v));

  return {
    ageRange: str(formData.ageRange),
    gender: str(formData.gender),
    primaryGameType: String(formData.primaryGameType),
    gameTypesCount: formData.gameTypesCount === PREFER_NOT ? null : num(formData.gameTypesCount, 1),
    daysPerMonth: num(formData.daysPerMonth, 0),
    avgSessionMinutes: formData.avgSessionMinutes === PREFER_NOT ? null : num(formData.avgSessionMinutes, 30),
    nightPlayPercent:
      formData.nightPlayPercent === PREFER_NOT ? null : num(formData.nightPlayPercent, 0),
    avgWagerEuro: num(formData.avgWagerEuro, 0),
    weeklyTotalEuro:
      formData.weeklyTotalEuro === PREFER_NOT ? null : num(formData.weeklyTotalEuro, null),
    wagerVariability: str(formData.wagerVariability),
    depositsPerSession:
      formData.depositsPerSession === PREFER_NOT ? null : num(formData.depositsPerSession, 0),
    chasingFrequency: str(formData.chasingFrequency),
    cancelWithdrawalCount: str(formData.cancelWithdrawalCount),
    limitsSet: str(formData.limitsSet),
    failedStopAttempts: str(formData.failedStopAttempts),
    relationshipConflict: str(formData.relationshipConflict),
    riskAwareness: str(formData.riskAwareness),
  };
}
