/**
 * Minimal Markdown → React nodes for BIBLIOGRAPHY.md (headings, lists, emphasis).
 * @param {string} markdown
 */
export function parseBibliographyMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  /** @type {import('react').ReactNode[]} */
  const nodes = [];
  /** @type {string[]} */
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${key++}`} className="bibliography-list">
        {listItems.map((item, i) => (
          <li key={i}>{formatInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      nodes.push(
        <h1 key={`h1-${key++}`} className="app-title bibliography-page__title">
          {trimmed.slice(2)}
        </h1>,
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      nodes.push(
        <h2 key={`h2-${key++}`} className="app-section-title bibliography-page__section">
          {trimmed.slice(3)}
        </h2>,
      );
      continue;
    }
    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
      continue;
    }
    flushList();
    nodes.push(
      <p key={`p-${key++}`} className="bibliography-page__intro">
        {formatInline(trimmed)}
      </p>,
    );
  }
  flushList();
  return nodes;
}

/** @param {string} text */
function formatInline(text) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
