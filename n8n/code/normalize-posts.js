// Turn DEV and Hacker News results into the Article shape the website uses
// (src/types/article.ts), and drop duplicates that link to the same page.

function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const value = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) && value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : match;
    }
    return named[code.toLowerCase()] ?? match;
  });
}

// n8n's Code sandbox has no URL global, so parse with regexes.
function domainOf(url) {
  const match = /^https?:\/\/([^/?#:]+)/i.exec(url ?? '');
  return match ? match[1].toLowerCase().replace(/^www\./, '') : null;
}

function urlKey(url) {
  const match = /^https?:\/\/([^/?#]+)([^?#]*)/i.exec(url ?? '');
  return match ? `${match[1].replace(/^www\./i, '')}${match[2].replace(/\/+$/, '')}`.toLowerCase() : String(url);
}

const posts = [];

for (const { json: a } of $('Fetch DEV top posts').all()) {
  if (!a || typeof a.id !== 'number' || !a.title || !a.url) continue;
  const tagList = Array.isArray(a.tag_list) ? a.tag_list : String(a.tag_list ?? '').split(',');
  const username = a.user?.username ?? 'unknown';
  posts.push({
    id: `devto:${a.id}`,
    source: 'devto',
    nativeId: String(a.id),
    title: decodeEntities(a.title.trim()),
    summary: a.description ? decodeEntities(a.description.trim()) || null : null,
    url: a.url,
    domain: 'dev.to',
    discussionUrl: `${a.url}#comments`,
    coverImage: a.cover_image || null,
    tags: [...new Set(tagList.map((t) => t.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean))],
    author: {
      name: a.user?.name?.trim() || username,
      handle: username,
      avatarUrl: a.user?.profile_image_90 || undefined,
      profileUrl: `https://dev.to/${username}`,
    },
    publishedAt: a.published_timestamp ?? a.published_at ?? new Date().toISOString(),
    readingTimeMinutes: a.reading_time_minutes ?? null,
    score: a.public_reactions_count ?? a.positive_reactions_count ?? 0,
    commentCount: a.comments_count ?? 0,
  });
}

const hn = $('Fetch HN front page').first()?.json;
for (const h of hn?.hits ?? []) {
  const title = h.title?.trim();
  if (!title || !h.objectID) continue;
  const discussionUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
  const external = h.url?.trim() || null;
  posts.push({
    id: `hackernews:${h.objectID}`,
    source: 'hackernews',
    nativeId: String(h.objectID),
    title: decodeEntities(title),
    summary: null,
    url: external ?? discussionUrl,
    domain: external ? domainOf(external) : 'news.ycombinator.com',
    discussionUrl,
    coverImage: null,
    tags: [],
    author: {
      name: h.author,
      handle: h.author,
      profileUrl: `https://news.ycombinator.com/user?id=${encodeURIComponent(h.author)}`,
    },
    publishedAt: h.created_at,
    readingTimeMinutes: null,
    score: h.points ?? 0,
    commentCount: h.num_comments ?? 0,
  });
}

const seen = new Set();
const unique = posts.filter((post) => {
  const key = urlKey(post.url);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (unique.length === 0) {
  throw new Error('No posts were fetched from DEV or Hacker News. Check the two fetch nodes for errors.');
}

return unique.map((post) => ({ json: post }));
