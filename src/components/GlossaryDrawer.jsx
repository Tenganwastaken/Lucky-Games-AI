'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { GLOSSARY } from '@/lib/glossary';
import ModalBackdrop from '@/components/ModalBackdrop';
import { GLOSSARY_FULL_BIBLIOGRAPHY_LINK } from '@/lib/strings';

const GREEK_ALPHABET = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'.split('');
const LATIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function firstLetter(term) {
  const trimmed = (term || '').trim();
  if (!trimmed) return '#';
  const ch = trimmed[0].toUpperCase();
  if (/[Α-Ω]/.test(ch)) return ch;
  if (/[A-Z]/.test(ch)) return ch;
  if (/[α-ω]/.test(ch)) return ch.toUpperCase();
  if (/[a-z]/.test(ch)) return ch.toUpperCase();
  return '#';
}

function groupByLetter(items) {
  const groups = new Map();
  for (const item of items) {
    const letter = firstLetter(item.term);
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(item);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'el'));
}

export default function GlossaryDrawer() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, 'el'));
    return GLOSSARY.filter(
      (item) =>
        item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q),
    ).sort((a, b) => a.term.localeCompare(b.term, 'el'));
  }, [query]);

  const grouped = useMemo(() => groupByLetter(filtered), [filtered]);

  const alphabetLetters = useMemo(() => {
    const fromData = new Set(grouped.map(([letter]) => letter));
    const ordered = [];
    for (const l of GREEK_ALPHABET) {
      if (fromData.has(l)) ordered.push(l);
    }
    for (const l of LATIN_ALPHABET) {
      if (fromData.has(l)) ordered.push(l);
    }
    if (fromData.has('#')) ordered.push('#');
    for (const l of fromData) {
      if (!ordered.includes(l)) ordered.push(l);
    }
    return ordered;
  }, [grouped]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  }, []);

  const openDrawer = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const scrollToLetter = (letter) => {
    const el = document.getElementById(`glossary-section-${letter}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="glossary-fab"
        onClick={openDrawer}
        aria-expanded={open}
        aria-controls="glossary-drawer-panel"
      >
        📖 Όροι
      </button>

      <ModalBackdrop
        className={`glossary-backdrop ${open ? 'glossary-backdrop--open' : ''}`}
        onClose={close}
        label="Κλείσιμο λεξικού"
        open={open}
      />

      <aside
        id="glossary-drawer-panel"
        ref={panelRef}
        className={`glossary-drawer ${open ? 'glossary-drawer--open' : ''}`}
        role="complementary"
        aria-label="Εκπαιδευτικό λεξικό"
        aria-labelledby={titleId}
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
        tabIndex={-1}
      >
        <header className="glossary-drawer__header">
          <h2 id={titleId} className="glossary-drawer__title">
            Εκπαιδευτικό λεξικό
          </h2>
          <button
            type="button"
            className="glossary-drawer__close"
            onClick={close}
            aria-label="Κλείσιμο λεξικού"
          >
            ×
          </button>
        </header>

        <div className="glossary-drawer__search-wrap">
          <label className="glossary-drawer__search-label" htmlFor="glossary-search">
            Αναζήτηση
          </label>
          <input
            id="glossary-search"
            ref={searchRef}
            type="search"
            className="input glossary-drawer__search"
            placeholder="Αναζήτηση όρου…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <p className="glossary-drawer__bibliography-link">
            <Link href="/bibliography" className="app-link" onClick={close}>
              {GLOSSARY_FULL_BIBLIOGRAPHY_LINK}
            </Link>
          </p>
        </div>

        <div className="glossary-drawer__body">
          {alphabetLetters.length > 0 && (
            <nav className="glossary-alpha" aria-label="Αλφαβητικό ευρετήριο">
              {alphabetLetters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  className="glossary-alpha__btn"
                  onClick={() => scrollToLetter(letter)}
                >
                  {letter}
                </button>
              ))}
            </nav>
          )}

          <div className="glossary-drawer__content">
            {filtered.length === 0 ? (
              <p className="glossary-empty">Δεν βρέθηκαν όροι για αυτή την αναζήτηση.</p>
            ) : (
              grouped.map(([letter, items]) => (
                <section
                  key={letter}
                  id={`glossary-section-${letter}`}
                  className="glossary-section"
                  aria-labelledby={`glossary-heading-${letter}`}
                >
                  <h3 id={`glossary-heading-${letter}`} className="glossary-section__letter">
                    {letter}
                  </h3>
                  <ul className="glossary-list">
                    {items.map((item) => (
                      <li key={item.term}>
                        <article className="glossary-card">
                          <h4 className="glossary-card__term">{item.term}</h4>
                          <p className="glossary-card__def">{item.definition}</p>
                          <p className="glossary-card__source">Πηγή: {item.source}</p>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
