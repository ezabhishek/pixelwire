// One Ollama request per post: a 1-10 quality score, up to three tags and a short reason.
const cfg = $('Config').first().json;

// Same tag list as the website's sidebar (generated from src/lib/tags.ts).
const TAGS = __TAG_SLUGS__;

const SYSTEM = `You are the editor of a daily news digest for professional software developers.
You rate one post at a time and answer only with JSON.

Scoring guide:
9-10: news or deep technical content most developers should see: major releases, security incidents, notable research, excellent in-depth tutorials.
7-8: solid and useful or interesting for many developers.
5-6: niche but legitimate.
3-4: thin or generic: beginner listicles, opinion without substance, marketing-heavy posts.
1-2: spam, crypto or trading promotion, ads, clickbait, off-topic.

Use the whole range. On a typical day only a handful of posts deserve 9 or 10; most solid posts are 6-8.
Judge the substance, not the popularity numbers. Tags must come from the allowed list; use none if nothing fits.`;

const SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 10 },
    tags: { type: 'array', items: { type: 'string', enum: TAGS }, maxItems: 3 },
    reason: { type: 'string', maxLength: 160 },
  },
  required: ['score', 'tags', 'reason'],
};

function describe(post) {
  const source = post.source === 'devto' ? 'DEV Community (developer blog platform)' : 'Hacker News (link aggregator)';
  const lines = [
    `Title: ${post.title}`,
    `Source: ${source}`,
    `Site: ${post.domain ?? 'unknown'}`,
  ];
  if (post.tags.length > 0) lines.push(`Author's tags: ${post.tags.join(', ')}`);
  if (post.summary) lines.push(`Description: ${post.summary.slice(0, 400)}`);
  lines.push(`Popularity: ${post.score} ${post.source === 'devto' ? 'reactions' : 'points'}, ${post.commentCount} comments`);
  lines.push(`Allowed tags: ${TAGS.join(', ')}`);
  return lines.join('\n');
}

return $input.all().map(({ json: post }) => ({
  json: {
    post,
    request: {
      model: cfg.models.score,
      stream: false,
      think: false,
      keep_alive: '5m',
      format: SCHEMA,
      options: { temperature: 0.1, num_ctx: 4096 },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: describe(post) },
      ],
    },
  },
}));
