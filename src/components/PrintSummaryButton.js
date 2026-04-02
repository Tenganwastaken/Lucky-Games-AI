'use client';

export default function PrintSummaryButton({ label = 'Print / Save as PDF' }) {
  return (
    <button
      type="button"
      className="no-print"
      onClick={() => window.print()}
      style={{
        padding: '0.55rem 1rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'linear-gradient(to right, #2563eb, #4f46e5)',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
      }}
    >
      {label}
    </button>
  );
}
