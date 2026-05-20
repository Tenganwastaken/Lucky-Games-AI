'use client';

import { PRINT_SAVE_PDF } from '@/lib/strings';

export default function PrintSummaryButton({ label = PRINT_SAVE_PDF }) {
  return (
    <button type="button" className="no-print btn btn-primary btn-pill" onClick={() => window.print()}>
      {label}
    </button>
  );
}
