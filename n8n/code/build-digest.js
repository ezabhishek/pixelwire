// Assemble the digest JSON the website reads (see src/types/digest.ts).
const cfg = $('Config').first().json;
const { candidates } = $('Build editor request').first().json;
const editorOutput = $input.first()?.json;

let editor = null;
try {
  editor = JSON.parse(editorOutput?.message?.content ?? '');
} catch {
  editor = null;
}

const byId = new Map(candidates.map((post) => [post.id, post]));
const chosen = [];
const used = new Set();

for (const pick of Array.isArray(editor?.picks) ? editor.picks : []) {
  const post = byId.get(pick?.id);
  if (!post || used.has(post.id)) continue;
  used.add(post.id);
  chosen.push({ post, why: typeof pick.why === 'string' ? pick.why.trim() : '' });
}

// If the editor returned too few valid picks, fill up by quality score.
for (const post of candidates) {
  if (chosen.length >= cfg.topN) break;
  if (used.has(post.id)) continue;
  used.add(post.id);
  chosen.push({ post, why: '' });
}

const items = chosen.slice(0, cfg.topN).map(({ post, why }, index) => ({
  rank: index + 1,
  summary: post.digestSummary,
  why: why || null,
  quality: post.quality,
  article: {
    id: post.id,
    source: post.source,
    nativeId: post.nativeId,
    title: post.title,
    summary: post.summary,
    url: post.url,
    domain: post.domain,
    discussionUrl: post.discussionUrl,
    coverImage: post.coverImage,
    tags: post.tags,
    author: post.author,
    publishedAt: post.publishedAt,
    readingTimeMinutes: post.readingTimeMinutes,
    score: post.score,
    commentCount: post.commentCount,
  },
}));

const intro =
  typeof editor?.intro === 'string' && editor.intro.trim().length > 0
    ? editor.intro.trim()
    : `Today's ${items.length} most useful posts for developers from DEV and Hacker News.`;

const digest = {
  version: 1,
  date: cfg.date,
  generatedAt: new Date().toISOString(),
  intro,
  items,
  stats: {
    fetched: candidates[0]?.fetchedCount ?? candidates.length,
    shortlisted: candidates.length,
    published: items.length,
    scoringFailures: candidates[0]?.scoringFailures ?? 0,
    summaryFailures: candidates.filter((post) => post.summaryFailed).length,
    editorFallback: editor === null,
  },
  models: cfg.models,
};

return [{ json: { digest } }];
