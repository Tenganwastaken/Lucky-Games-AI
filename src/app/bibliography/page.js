import { readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import { parseBibliographyMarkdown } from '@/lib/parse-bibliography-md';
import { BACK_HOME, BIBLIOGRAPHY_PAGE_TITLE } from '@/lib/strings';

export const metadata = {
  title: `${BIBLIOGRAPHY_PAGE_TITLE} | Lucky Games`,
  description: 'Πλήρης κατάλογος βιβλιογραφικών αναφορών της πτυχιακής εργασίας.',
};

function loadBibliographyMarkdown() {
  const filePath = path.join(process.cwd(), 'BIBLIOGRAPHY.md');
  return readFileSync(filePath, 'utf8');
}

export default function BibliographyPage() {
  const markdown = loadBibliographyMarkdown();
  const content = parseBibliographyMarkdown(markdown);

  return (
    <main id="main-content" className="app-shell app-shell--centered">
      <article className="app-card app-card--article bibliography-page">
        <SiteNav />
        <p style={{ marginBottom: '1rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            {BACK_HOME}
          </Link>
        </p>
        <div className="bibliography-page__body">{content}</div>
      </article>
    </main>
  );
}
