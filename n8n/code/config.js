// ─── Pixel Wires daily digest: settings ──────────────────────────────────────
// Edit the values in CONFIG, save, then use "Execute workflow" to test.
const CONFIG = {
  // WhatsApp number that receives the digest: country code + number, digits only.
  // Example for India: 919876543210
  whatsappTo: '__WHATSAPP_TO__',
  // OpenWA session id: OpenWA dashboard (http://localhost:2785) → Sessions.
  openwaSessionId: '__OPENWA_SESSION__',

  // Services as seen from inside the n8n Docker container.
  openwaUrl: 'http://host.docker.internal:2785',
  ollamaUrl: 'http://host.docker.internal:11434',

  // Where the digest is published. Vercel redeploys on every push to this branch.
  githubOwner: 'ezabhishek',
  githubRepo: 'pixelwire',
  githubBranch: 'main',
  siteUrl: 'https://pixelwire.vercel.app',

  models: {
    score: 'qwen3.5:4b', // rates and tags every fetched post (fast, many calls)
    summary: 'qwen3:8b', // summarizes the shortlisted posts
    editor: 'gemma4:12b', // picks the final list and writes the intro (one call)
  },

  postsPerSource: 30, // fetched from each of DEV and Hacker News
  minScore: 6, // quality score (1-10) needed to reach the shortlist
  maxCandidates: 20, // shortlist size sent for summaries
  topN: 10, // posts in the published digest
  postsInWhatsApp: 5, // posts listed in the WhatsApp message
};
// ──────────────────────────────────────────────────────────────────────────────

const problems = [];
if (!/^\d{8,15}$/.test(CONFIG.whatsappTo)) {
  problems.push('whatsappTo must be your number with country code, digits only (for example 919876543210)');
}
if (!CONFIG.openwaSessionId || CONFIG.openwaSessionId.startsWith('__')) {
  problems.push('openwaSessionId is empty; copy it from the OpenWA dashboard');
}
if (CONFIG.topN > CONFIG.maxCandidates) problems.push('topN cannot be larger than maxCandidates');
if (problems.length > 0) throw new Error(`Config: ${problems.join('; ')}`);

// $now uses the workflow timezone (Asia/Kolkata), so the date matches the 07:00 run.
return [
  {
    json: {
      ...CONFIG,
      date: $now.toFormat('yyyy-MM-dd'),
      dateLabel: $now.toFormat('cccc, d LLLL yyyy'),
      startedAt: $now.toISO(),
    },
  },
];
