'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import {
  DEFAULT_FORM_DATA,
  SECTIONS,
  SECTION_COUNT,
  PREFER_NOT,
  NO_PREFER_NOT_FIELDS,
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  PRIMARY_GAME_TYPE_OPTIONS,
  WAGER_VARIABILITY_OPTIONS,
  CHASING_FREQUENCY_OPTIONS,
  CANCEL_WITHDRAWAL_OPTIONS,
  LIMITS_SET_OPTIONS,
  FAILED_STOP_OPTIONS,
  RELATIONSHIP_CONFLICT_OPTIONS,
  RISK_AWARENESS_OPTIONS,
  loadDraftFromStorage,
  saveDraftToStorage,
  clearDraftStorage,
} from '@/lib/risk-assessment-form';
import { validateRiskAssessment } from '@/lib/risk-assessment-validate';
import { DEV_MAP_COUNTRY, DEV_MAP_PLACEHOLDER } from '@/lib/strings';
import InfoTooltip from '@/components/InfoTooltip';
import FieldLabel from '@/components/advisor/FieldLabel';
import { useToast } from '@/components/Toast';
import { TOAST_DRAFT_SAVED } from '@/lib/strings';

const IS_DEV = process.env.NODE_ENV === 'development';

function PreferNotLink({ field, onPrefer }) {
  if (NO_PREFER_NOT_FIELDS.has(field)) return null;
  return (
    <button type="button" className="advisor-prefer-not" onClick={() => onPrefer(field)}>
      Δεν θέλω να απαντήσω
    </button>
  );
}

function RadioGroup({ name, options, value, onChange, onPrefer, error, field }) {
  return (
    <fieldset className="advisor-radio-group">
      <div className="advisor-radio-grid">
        {options.map((opt) => (
          <label key={opt.value} className="advisor-radio-label">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(name, opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <PreferNotLink field={field} onPrefer={onPrefer} />
      {error ? (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function SliderField({ name, label, fieldKey, min, max, step, value, onChange, onPrefer, error, unit = '' }) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const num = value === PREFER_NOT ? min : Number(value);
  return (
    <div className="advisor-slider-field">
      <label htmlFor={inputId} className="advisor-slider-head">
        <FieldLabel fieldKey={fieldKey}>{label}</FieldLabel>
        <strong>
          {num}
          {unit}
        </strong>
      </label>
      <input
        id={inputId}
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={num}
        disabled={value === PREFER_NOT}
        onChange={(e) => onChange(name, e.target.value)}
        className="advisor-range"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <PreferNotLink field={name} onPrefer={onPrefer} />
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function AdvisorRiskForm({
  onSubmit,
  loading,
  error: apiError,
  initialFormData,
  initialSection = 1,
  devCountryCode,
  onDevCountryChange,
  onValidationError,
}) {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_FORM_DATA,
    ...initialFormData,
  }));
  const [activeSection, setActiveSection] = useState(initialSection);
  const [errors, setErrors] = useState({});
  const [saveHint, setSaveHint] = useState('');
  const toast = useToast();

  useEffect(() => {
    const draft = loadDraftFromStorage();
    if (draft && !initialFormData) {
      setFormData(draft.formData);
      setActiveSection(draft.activeSection ?? 1);
    }
  }, [initialFormData]);

  useEffect(() => {
    if (initialFormData) {
      setFormData({ ...DEFAULT_FORM_DATA, ...initialFormData });
      setActiveSection(initialSection);
    }
  }, [initialFormData, initialSection]);

  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const setPreferNot = useCallback(
    (name) => {
      setField(name, PREFER_NOT);
    },
    [setField],
  );

  const validateCurrent = useCallback(() => {
    if (activeSection === 1) return { valid: true, errors: {} };
    const { valid, errors: e } = validateRiskAssessment(formData, activeSection);
    setErrors(e);
    return { valid, errors: e };
  }, [activeSection, formData]);

  const goNext = () => {
    const { valid } = validateCurrent();
    if (!valid) return;
    setActiveSection((s) => Math.min(SECTION_COUNT, s + 1));
  };

  const goPrev = () => setActiveSection((s) => Math.max(1, s - 1));

  const handleSaveProgress = () => {
    saveDraftToStorage(formData, activeSection);
    setSaveHint(TOAST_DRAFT_SAVED);
    toast.success(TOAST_DRAFT_SAVED);
    setTimeout(() => setSaveHint(''), 3000);
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    const { valid, errors: validationErrors } = validateRiskAssessment(formData, 6);
    setErrors(validationErrors);
    if (!valid) {
      onValidationError?.(validationErrors);
      for (const sec of [2, 3, 4, 5, 6]) {
        const { errors: secErr } = validateRiskAssessment(formData, sec);
        if (Object.keys(secErr).length > 0) {
          setActiveSection(sec);
          break;
        }
      }
      return;
    }
    clearDraftStorage();
    onSubmit(formData);
  };

  const section = SECTIONS[activeSection - 1];
  const progressPct = (activeSection / SECTION_COUNT) * 100;

  const formErrorSummary =
    Object.keys(errors).length > 0 ? Object.values(errors).filter(Boolean)[0] : null;

  return (
    <form onSubmit={handleSubmit} className="panel advisor-form advisor-wizard" noValidate>
      {formErrorSummary ? (
        <p className="callout callout--danger" role="alert" aria-live="assertive">
          {formErrorSummary}
        </p>
      ) : null}
      <div className="advisor-progress" role="status" aria-live="polite">
        <div className="advisor-progress__label">
          Βήμα {activeSection} από {SECTION_COUNT}
        </div>
        <div className="advisor-progress__track">
          <div className="advisor-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div key={activeSection} className={`advisor-section-panel advisor-section-panel--${activeSection}`}>
        <div className="advisor-section-head">
          <h2 className="app-section-title">
            {section.title}
            {section.subtitle ? (
              <span className="advisor-section-sub"> ({section.subtitle})</span>
            ) : null}
          </h2>
          {section.tooltip ? (
            <InfoTooltip
              title={section.tooltip.title}
              body={section.tooltip.body}
              source={section.tooltip.source}
            />
          ) : null}
        </div>

        {activeSection === 1 && (
          <>
            <p className="callout callout--muted advisor-demographics-note">
              Τα δημογραφικά στοιχεία χρησιμοποιούνται μόνο για στατιστική κανονικοποίηση και δεν
              αποθηκεύονται με το όνομά σου.
            </p>
            <label className="field-inline">
              <span>Ηλικιακή ομάδα</span>
              <select
                className="select-input"
                value={formData.ageRange}
                onChange={(e) => setField('ageRange', e.target.value)}
              >
                <option value="">— Επιλογή —</option>
                {AGE_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-inline">
              <span>Φύλο</span>
              <RadioGroup
                name="gender"
                field="gender"
                options={GENDER_OPTIONS}
                value={formData.gender}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.gender}
              />
            </div>
          </>
        )}

        {activeSection === 2 && (
          <>
            {IS_DEV && onDevCountryChange && (
              <label className="callout callout--warn field-inline">
                <span>{DEV_MAP_COUNTRY}</span>
                <input
                  type="text"
                  maxLength={2}
                  placeholder={DEV_MAP_PLACEHOLDER}
                  value={devCountryCode || ''}
                  onChange={(e) => onDevCountryChange(e.target.value.toUpperCase())}
                  className="input"
                  style={{ maxWidth: 120 }}
                />
              </label>
            )}
            <label className="field-inline">
              <span>Κύριος τύπος παιχνιδιού</span>
              <select
                className="select-input"
                value={formData.primaryGameType}
                onChange={(e) => setField('primaryGameType', e.target.value)}
                required
              >
                <option value="">— Επιλογή —</option>
                {PRIMARY_GAME_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.primaryGameType ? (
                <p className="field-error">{errors.primaryGameType}</p>
              ) : null}
            </label>
            <label className="field-inline">
              <FieldLabel fieldKey="gameTypesCount">
                Σε πόσους διαφορετικούς τύπους παιχνιδιών συμμετέχεις τακτικά;
              </FieldLabel>
              <input
                type="number"
                min={1}
                max={8}
                className="number-input"
                value={formData.gameTypesCount === PREFER_NOT ? '' : formData.gameTypesCount}
                disabled={formData.gameTypesCount === PREFER_NOT}
                onChange={(e) => setField('gameTypesCount', e.target.value)}
              />
              <PreferNotLink field="gameTypesCount" onPrefer={setPreferNot} />
              {errors.gameTypesCount ? (
                <p className="field-error">{errors.gameTypesCount}</p>
              ) : null}
            </label>
          </>
        )}

        {activeSection === 3 && (
          <>
            <SliderField
              name="daysPerMonth"
              fieldKey="daysPerMonth"
              label="Πόσες ημέρες τον μήνα παίζεις κατά μέσο όρο;"
              min={0}
              max={30}
              step={1}
              value={formData.daysPerMonth}
              onChange={setField}
              onPrefer={setPreferNot}
              error={errors.daysPerMonth}
            />
            <SliderField
              name="avgSessionMinutes"
              fieldKey="avgSessionMinutes"
              label="Μέση διάρκεια συνεδρίας (λεπτά);"
              min={5}
              max={360}
              step={5}
              value={formData.avgSessionMinutes}
              onChange={setField}
              onPrefer={setPreferNot}
              error={errors.avgSessionMinutes}
              unit=" λεπτά"
            />
            <SliderField
              name="nightPlayPercent"
              fieldKey="nightPlayPercent"
              label="Τι ποσοστό των συνεδριών είναι μεταξύ 00:00–06:00;"
              min={0}
              max={100}
              step={5}
              value={formData.nightPlayPercent}
              onChange={setField}
              onPrefer={setPreferNot}
              error={errors.nightPlayPercent}
              unit="%"
            />
          </>
        )}

        {activeSection === 4 && (
          <>
            <label className="field-inline">
              <FieldLabel fieldKey="avgWagerEuro">Μέσο μέγεθος στοιχήματος (€)</FieldLabel>
              <input
                type="number"
                min={0}
                step={0.01}
                className="number-input"
                value={formData.avgWagerEuro === PREFER_NOT ? '' : formData.avgWagerEuro}
                disabled={formData.avgWagerEuro === PREFER_NOT}
                onChange={(e) => setField('avgWagerEuro', e.target.value)}
              />
              {errors.avgWagerEuro ? <p className="field-error">{errors.avgWagerEuro}</p> : null}
            </label>
            <label className="field-inline">
              <FieldLabel fieldKey="weeklyTotalEuro">
                Συνολικό εβδομαδιαίο ποσό στοιχηματισμού (€)
              </FieldLabel>
              <input
                type="number"
                min={0}
                step={0.01}
                className="number-input"
                value={formData.weeklyTotalEuro === PREFER_NOT ? '' : formData.weeklyTotalEuro}
                disabled={formData.weeklyTotalEuro === PREFER_NOT}
                onChange={(e) => setField('weeklyTotalEuro', e.target.value)}
              />
              <PreferNotLink field="weeklyTotalEuro" onPrefer={setPreferNot} />
              {errors.weeklyTotalEuro ? (
                <p className="field-error">{errors.weeklyTotalEuro}</p>
              ) : null}
            </label>
            
            <div className="field-inline">
              <FieldLabel fieldKey="wagerVariability">Μεταβλητότητα πονταρίσματος</FieldLabel>
              <p className="field-hint">
                Π.χ. αν συνήθως ποντάρεις 5–10€ είναι σταθερό· αν κυμαίνεσαι από 2€ έως 100€ είναι πολύ
                μεταβλητό.
              </p>
              <RadioGroup
                name="wagerVariability"
                field="wagerVariability"
                options={WAGER_VARIABILITY_OPTIONS}
                value={formData.wagerVariability}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.wagerVariability}
              />
            </div>

          </>
        )}

        {activeSection === 5 && (
          <>
            <label className="field-inline">
              <FieldLabel fieldKey="depositsPerSession">
                Μέσος αριθμός καταθέσεων ανά συνεδρία;
              </FieldLabel>
              <input
                type="number"
                min={0}
                max={20}
                className="number-input"
                value={formData.depositsPerSession === PREFER_NOT ? '' : formData.depositsPerSession}
                disabled={formData.depositsPerSession === PREFER_NOT}
                onChange={(e) => setField('depositsPerSession', e.target.value)}
              />
              <PreferNotLink field="depositsPerSession" onPrefer={setPreferNot} />
              {errors.depositsPerSession ? (
                <p className="field-error">{errors.depositsPerSession}</p>
              ) : null}
            </label>
            <div className="field-inline">
              <FieldLabel fieldKey="chasingFrequency">
                Πόσο συχνά αυξάνεις το ποσό στοιχήματος αμέσως μετά από απώλεια για να την
                ανακτήσεις;
              </FieldLabel>
              <RadioGroup
                name="chasingFrequency"
                field="chasingFrequency"
                options={CHASING_FREQUENCY_OPTIONS}
                value={formData.chasingFrequency}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.chasingFrequency}
              />
            </div>
            <div className="field-inline">
              <FieldLabel fieldKey="cancelWithdrawalCount">
                Έχει τύχει να ακυρώσεις αίτημα ανάληψης για να συνεχίσεις να παίζεις;
              </FieldLabel>
              <RadioGroup
                name="cancelWithdrawalCount"
                field="cancelWithdrawalCount"
                options={CANCEL_WITHDRAWAL_OPTIONS}
                value={formData.cancelWithdrawalCount}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.cancelWithdrawalCount}
              />
            </div>
          </>
        )}

        {activeSection === 6 && (
          <>
            <div className="field-inline">
              <FieldLabel fieldKey="limitsSet">Έχεις θέσει όρια κατάθεσης ή απώλειας;</FieldLabel>
              <RadioGroup
                name="limitsSet"
                field="limitsSet"
                options={LIMITS_SET_OPTIONS}
                value={formData.limitsSet}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.limitsSet}
              />
            </div>
            
            <div className="field-inline">
              <FieldLabel fieldKey="failedStopAttempts">
                Πόσες φορές προσπάθησες να σταματήσεις ή να μειώσεις το παιχνίδι χωρίς να τα
                καταφέρεις;
              </FieldLabel>
              <RadioGroup
                name="failedStopAttempts"
                field="failedStopAttempts"
                options={FAILED_STOP_OPTIONS}
                value={formData.failedStopAttempts}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.failedStopAttempts}
              />
            </div>
            <div className="field-inline">
              <FieldLabel fieldKey="relationshipConflict">
                Έχει το παιχνίδι προκαλέσει εντάσεις στις σχέσεις ή στη δουλειά σου;
              </FieldLabel>
              <RadioGroup
                name="relationshipConflict"
                field="relationshipConflict"
                options={RELATIONSHIP_CONFLICT_OPTIONS}
                value={formData.relationshipConflict}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.relationshipConflict}
              />
            </div>
            <div className="field-inline">
              <FieldLabel fieldKey="riskAwareness">
                Γνωρίζεις το μακροπρόθεσμο αναμενόμενο αποτέλεσμα (house edge) των παιχνιδιών που
                παίζεις;
              </FieldLabel>
              <RadioGroup
                name="riskAwareness"
                field="riskAwareness"
                options={RISK_AWARENESS_OPTIONS}
                value={formData.riskAwareness}
                onChange={setField}
                onPrefer={setPreferNot}
                error={errors.riskAwareness}
              />
            </div>

          </>
        )}
      </div>

      <div className="advisor-wizard-nav">
        {activeSection > 1 ? (
          <button type="button" className="btn btn-secondary btn-pill" onClick={goPrev}>
            Πίσω
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-ghost btn-pill" onClick={handleSaveProgress}>
          Αποθήκευση προόδου
        </button>
        {activeSection < SECTION_COUNT ? (
          <button type="button" className="btn btn-primary btn-pill" onClick={goNext}>
            Επόμενο
          </button>
        ) : (
          <button type="submit" className="btn btn-primary btn-pill" disabled={loading}>
            {loading ? 'Ανάλυση…' : 'Εκτέλεση ανάλυσης'}
          </button>
        )}
      </div>
      {saveHint ? <p className="advisor-save-hint">{saveHint}</p> : null}
      {apiError ? (
        <p className="callout callout--danger" role="alert" aria-live="assertive">
          {apiError}
        </p>
      ) : null}
    </form>
  );
}
