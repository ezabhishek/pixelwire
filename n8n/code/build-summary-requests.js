// Extract readable text from each shortlisted page and ask for a two-sentence summary.
const cfg = $('Config').first().json;
const candidates = $('Pick candidates').all();
const pages = $input.all();
const MAX_TEXT = 5000;

function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–' };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const value = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) && value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : match;
    }
    return named[code.toLowerCase()] ?? match;
  });
}

function extractText(html) {
  if (typeof html !== 'string' || html.length === 0) return '';
  let body = html;
  const main = body.match(/<article[\s\S]*?<\/article>/i) ?? body.match(/<main[\s\S]*?<\/main>/i);
  if (main) body = main[0];
  body = body
    .replace(/<(script|style|noscript|svg|nav|header|footer|form|aside|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|pre|blockquote|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(body)
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, MAX_TEXT);
}

const SYSTEM = `You write entries for a daily news digest for professional software developers.
Write exactly two plain sentences (at most 60 words) saying what the post is about and why a developer might care.
Use only facts from the provided text. If the article text is missing or thin, describe what the link covers based on the title and site, without inventing details.
No hype, no emojis, no markdown, and do not start with "This article" or "The post".`;

const SCHEMA = {
  type: 'object',
  properties: { summary: { type: 'string', maxLength: 420 } },
  required: ['summary'],
};

return candidates.map(({ json: post }, index) => {
  const text = extractText(pages[index]?.json?.data);
  const userLines = [
    `Title: ${post.title}`,
    `Source: ${post.source === 'devto' ? 'DEV Community' : 'Hacker News'}`,
    `Site: ${post.domain ?? 'unknown'}`,
  ];
  if (post.summary) userLines.push(`Description: ${post.summary}`);
  userLines.push(text.length >= 200 ? `Article text:\n${text}` : 'Article text: (not available)');

  return {
    json: {
      post: { ...post, extractedChars: text.length },
      request: {
        model: cfg.models.summary,
        stream: false,
        think: false,
        keep_alive: '5m',
        format: SCHEMA,
        options: { temperature: 0.3, num_ctx: 8192 },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userLines.join('\n') },
        ],
      },
    },
  };
});
