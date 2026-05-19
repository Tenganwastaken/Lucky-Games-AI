'use client';

export default function PrintSummaryButton({ label = 'Print / Save as PDF' }) {
  return (
    <button type="button" className="no-print btn btn-primary btn-pill" onClick={() => window.print()}>
      {label}
    </button>
  );
}
