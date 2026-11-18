// Attach summaries to the shortlist and build the single request for the editor model.
const cfg = $('Config').first().json;
const requests = $('Build summary requests').all();
const responses = $input.all();

function parseModelJson(item) {
  try {
    return JSON.parse(item?.json?.message?.content ?? '');
  } catch {
    return null;
  }
}

const candidates = requests.map(({ json }, index) => {
  const result = parseModelJson(responses[index]);
  const generated = typeof result?.summary === 'string' ? result.summary.trim() : '';
  return {
    ...json.post,
    digestSummary: generated || json.post.summary || json.post.qualityReason || json.post.title,
    summaryFailed: generated.length === 0,
  };
});

const pickCount = Math.min(cfg.topN, candidates.length);

const SYSTEM = `You are the editor of "Pixel Wires", a daily news digest for professional software developers.
From the candidates, choose the ${pickCount} best for today and order them, most important first.
Prefer a mix of sources and topics, and skip near-duplicates of the same story.
For each pick write one short line (at most 20 words) on why it matters to developers.
Also write a 2-3 sentence intro for today's digest that names the main themes. Plain text, no emojis, no markdown.
Answer only with JSON.`;

const list = candidates
  .map((post) =>
    [
      `id: ${post.id}`,
      `title: ${post.title}`,
      `source: ${post.source === 'devto' ? 'DEV' : 'Hacker News'} (${post.domain ?? 'unknown'})`,
      `quality: ${post.quality}/10`,
      `summary: ${post.digestSummary}`,
    ].join('\n'),
  )
  .join('\n\n');

const SCHEMA = {
  type: 'object',
  properties: {
    intro: { type: 'string', maxLength: 600 },
    picks: {
      type: 'array',
      minItems: pickCount,
      maxItems: pickCount,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: candidates.map((post) => post.id) },
          why: { type: 'string', maxLength: 200 },
        },
        required: ['id', 'why'],
      },
    },
  },
  required: ['intro', 'picks'],
};

return [
  {
    json: {
      candidates,
      request: {
        model: cfg.models.editor,
        stream: false,
        think: false,
        keep_alive: '5m',
        format: SCHEMA,
        options: { temperature: 0.4, num_ctx: 16384 },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Date: ${cfg.dateLabel}\n\nCandidates:\n\n${list}` },
        ],
      },
    },
  },
];
