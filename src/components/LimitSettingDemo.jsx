'use client';

import { useEffect, useMemo, useState, useId } from 'react';
import Link from 'next/link';
import Skeleton from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import {
  LIMIT_SET_BUTTON,
  LIMIT_CARD_INTRO,
  LIMIT_FIELD_LABEL,
  LIMIT_PRIVACY_FOOTER,
  LIMIT_SAVING,
  LIMIT_SET_SUCCESS,
  TOAST_NETWORK_ERROR,
  LIMIT_OVER_MESSAGE,
  LIMIT_WITHIN_MESSAGE,
  LIMIT_CURRENT,
  LIMIT_SIGN_IN_HINT,
  NAV_SIGN_IN,
  formatCurrency,
} from '@/lib/strings';

const LOCAL_KEY = 'lucky-games-weekly-loss-limit';

function readLocalLimit() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeLocalLimit(value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_KEY, String(value));
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ analysisResult?: object | null, onLimitChange?: (limit: number | null) => void }} props
 */
export default function LimitSettingDemo({ analysisResult = null, onLimitChange }) {
  const [limit, setLimit] = useState(null);
  const [draft, setDraft] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);
  const toast = useToast();
  const limitInputId = useId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const user = data.user ?? null;
        setAuthUser(user);
        const fromDb =
          user?.weeklyLossLimit != null && Number.isFinite(user.weeklyLossLimit)
            ? user.weeklyLossLimit
            : null;
        const resolved = fromDb ?? readLocalLimit();
        if (resolved != null) {
          setLimit(resolved);
          onLimitChange?.(resolved);
        }
      } catch {
        const local = readLocalLimit();
        if (!cancelled && local != null) {
          setLimit(local);
          onLimitChange?.(local);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onLimitChange]);

  const comparison = useMemo(() => {
    if (limit == null || !analysisResult?.input) return null;
    const raw = analysisResult.input.weeklyTotalEuro;
    if (raw == null || raw === '') return null;
    const weekly = Number(raw);
    if (!Number.isFinite(weekly) || weekly < 0) return null;
    if (weekly > limit) {
      const pct = ((weekly - limit) / limit) * 100;
      return { status: 'over', weekly, pct };
    }
    return { status: 'within', weekly };
  }, [limit, analysisResult]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveOk(false);
    const value = Number(draft);
    if (!Number.isFinite(value) || value <= 0) {
      const msg = 'Εισήγαγε έγκυρο θετικό ποσό.';
      setSaveError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      if (authUser) {
        const res = await fetch('/api/user/loss-limit', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weeklyLossLimit: value }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (data && data.error) || 'Αποτυχία αποθήκευσης.';
          setSaveError(msg);
          toast.error(msg);
          return;
        }
      }
      writeLocalLimit(value);
      setLimit(value);
      onLimitChange?.(value);
      setSaveOk(true);
      toast.success(LIMIT_SET_SUCCESS);
      setTimeout(() => setSaveOk(false), 3000);
    } catch {
      setSaveError(TOAST_NETWORK_ERROR);
      toast.error(TOAST_NETWORK_ERROR);
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return (
      <aside className="limit-widget limit-widget--loading" aria-busy="true">
        <Skeleton width="55%" height={18} style={{ marginBottom: '0.75rem' }} />
        <Skeleton width="100%" height={42} />
        <Skeleton width="7rem" height={40} style={{ marginTop: '0.75rem', borderRadius: 999 }} />
      </aside>
    );
  }

  return (
    <aside className="limit-widget" aria-labelledby="limit-widget-title">
      {limit == null ? (
        <div className="limit-widget__card">
          <h2 id="limit-widget-title" className="limit-widget__title">
            {LIMIT_CARD_INTRO}
          </h2>
          <form onSubmit={handleSubmit} className="limit-widget__form">
            <label className="field-inline" htmlFor={limitInputId}>
              <span>{LIMIT_FIELD_LABEL}</span>
              <div className="limit-widget__input-row">
                <span className="limit-widget__currency" aria-hidden>
                  €
                </span>
                <input
                  id={limitInputId}
                  type="number"
                  min={1}
                  step={1}
                  className="number-input limit-widget__input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="π.χ. 50"
                  required
                  aria-invalid={saveError ? 'true' : undefined}
                />
              </div>
            </label>
            {!authUser ? (
              <p className="limit-widget__hint">
                {LIMIT_SIGN_IN_HINT}{' '}
                <Link href="/login" className="app-link">
                  {NAV_SIGN_IN}
                </Link>
                .
              </p>
            ) : null}
            {saveError ? <p className="field-error">{saveError}</p> : null}
            {saveOk ? <p className="limit-widget__ok">{LIMIT_SET_SUCCESS}</p> : null}
            <button type="submit" className="btn btn-primary btn-pill" disabled={saving}>
              {saving ? LIMIT_SAVING : LIMIT_SET_BUTTON}
            </button>
          </form>
        </div>
      ) : (
        <div className="limit-widget__card limit-widget__card--set">
          <p className="limit-widget__current">
            {LIMIT_CURRENT}: <strong>{formatCurrency(limit)}</strong>
          </p>
        </div>
      )}

      {comparison ? (
        <div
          className={`callout limit-widget__compare ${
            comparison.status === 'over' ? 'callout--danger' : 'callout--success'
          }`}
          role="status"
        >
          {comparison.status === 'over' ? (
            <p style={{ margin: 0 }}>
              ⚠️{' '}
              {LIMIT_OVER_MESSAGE.replace(
                '{pct}',
                comparison.pct.toFixed(0),
              ).replace('{weekly}', formatCurrency(comparison.weekly)).replace(
                '{limit}',
                formatCurrency(limit),
              )}
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              ✅ {LIMIT_WITHIN_MESSAGE.replace('{weekly}', formatCurrency(comparison.weekly))}
            </p>
          )}
        </div>
      ) : null}

      <p className="limit-widget__footer">{LIMIT_PRIVACY_FOOTER}</p>
    </aside>
  );
}
