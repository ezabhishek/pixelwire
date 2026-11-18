// Combine each post with its score, then keep the best ones for summarizing.
const cfg = $('Config').first().json;
const requests = $('Build scoring requests').all();
const responses = $input.all();

function parseModelJson(item) {
  try {
    return JSON.parse(item?.json?.message?.content ?? '');
  } catch {
    return null;
  }
}

const scored = requests.map((request, index) => {
  const post = request.json.post;
  const result = parseModelJson(responses[index]);
  const quality = Number.isInteger(result?.score) ? Math.min(10, Math.max(1, result.score)) : 0;
  const modelTags = Array.isArray(result?.tags) ? result.tags.filter((tag) => typeof tag === 'string') : [];
  return {
    ...post,
    // HN posts have no tags of their own; DEV posts keep the author's tags.
    tags: post.source === 'hackernews' ? [...new Set(modelTags)] : post.tags,
    quality,
    qualityReason: typeof result?.reason === 'string' ? result.reason : null,
  };
});

const failed = scored.filter((post) => post.quality === 0).length;
if (failed === scored.length) {
  throw new Error(`Scoring failed for every post. Is Ollama running, and is "${cfg.models.score}" pulled?`);
}

const engagement = (post) => post.score + post.commentCount;
const ranked = [...scored].sort((a, b) => b.quality - a.quality || engagement(b) - engagement(a));

let shortlist = ranked.filter((post) => post.quality >= cfg.minScore).slice(0, cfg.maxCandidates);
if (shortlist.length < cfg.topN) {
  // A slow news day: fill up with the next best so the digest still has topN posts.
  shortlist = ranked.filter((post) => post.quality > 0).slice(0, cfg.topN);
}

return shortlist.map((post) => ({ json: { ...post, scoringFailures: failed, fetchedCount: scored.length } }));
