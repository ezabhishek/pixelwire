// The WhatsApp message: intro, every post's title, a "why it matters" line for the top
// ones, and a link to the full page with summaries.
const cfg = $('Config').first().json;
const { digest } = $('Build digest').first().json;
const commitSha = $('Create commit').first().json.sha;

const sourceLabel = { devto: 'DEV', hackernews: 'HN' };
const label = (item) => sourceLabel[item.article.source] ?? item.article.source;
const detailed = digest.items.slice(0, cfg.postsInWhatsApp);
const rest = digest.items.slice(cfg.postsInWhatsApp);

const lines = [`*Pixel Wires · Daily digest*`, `_${cfg.dateLabel}_`, '', digest.intro, ''];

// Top posts: title, one line on why it matters, link.
for (const item of detailed) {
  lines.push(`*${item.rank}. ${item.article.title}* (${label(item)})`);
  lines.push(item.why || item.summary);
  lines.push(item.article.url);
  lines.push('');
}

// The rest: title and link only, so the whole list is in the message.
if (rest.length > 0) {
  lines.push('*Also today*');
  for (const item of rest) {
    lines.push(`${item.rank}. ${item.article.title} (${label(item)})`);
    lines.push(item.article.url);
  }
  lines.push('');
}

const pageUrl = `${cfg.siteUrl.replace(/\/+$/, '')}/today/${cfg.date}`;
lines.push(`All ${digest.items.length} with summaries: ${pageUrl}`);
lines.push('_The page goes live about a minute after this message._');

return [
  {
    json: {
      chatId: `${cfg.whatsappTo}@c.us`,
      text: lines.join('\n'),
      // Same key on an automatic retry, so a retried send can't arrive twice.
      idempotencyKey: `pixelwire-digest-${cfg.date}-${String(commitSha).slice(0, 12)}`,
    },
  },
];
