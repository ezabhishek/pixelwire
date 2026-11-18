const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
};

/** Decode numeric and common named HTML entities without touching the DOM. */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith('#')) {
      const isHex = code[1] === 'x' || code[1] === 'X';
      const value = isHex ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      if (Number.isFinite(value) && value > 0 && value <= 0x10ffff) return String.fromCodePoint(value);
      return match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Turn an HTML fragment into one line of plain text. */
export function stripHtml(html: string): string {
  const withBreaks = html.replace(/<\/?(p|br|li|div|h[1-6]|pre|blockquote)\b[^>]*>/gi, ' ');
  const withoutTags = withBreaks.replace(/<[^>]*>/g, '');
  return decodeEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

/** Shorten to at most `max` characters, preferring a word boundary. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, Math.max(0, max - 1));
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

export function getDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}
