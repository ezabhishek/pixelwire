#!/usr/bin/env node
/**
 * Builds the importable n8n workflows from the readable sources in n8n/code/.
 *
 *   node scripts/build-n8n-workflows.mjs            → n8n/workflows/*.json (what you import)
 *   node scripts/build-n8n-workflows.mjs --test DIR → a dry-run copy in DIR: real fetching and
 *     Ollama calls, but every GitHub and WhatsApp node disabled and dummy contact settings.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testIndex = process.argv.indexOf('--test');
const testMode = testIndex !== -1;
const outDir = testMode ? resolve(process.argv[testIndex + 1] ?? '') : join(root, 'n8n', 'workflows');
if (testMode && !process.argv[testIndex + 1]) throw new Error('--test needs an output directory');

// The dry run reuses the real id: importing the real workflow afterwards replaces it.
const DIGEST_ID = 'pwDailyDigest001';
const ALERT_ID = 'pwDigestAlert001';

// Tag slugs come from the website so the model only uses tags the sidebar knows.
const tagSource = readFileSync(join(root, 'src', 'lib', 'tags.ts'), 'utf8');
const tagSlugs = [...tagSource.matchAll(/slug: '([a-z0-9]+)'/g)].map((match) => match[1]);
if (tagSlugs.length < 10) throw new Error(`Expected the tag catalog in src/lib/tags.ts, found ${tagSlugs.length} slugs`);

function loadCode(file) {
  let code = readFileSync(join(root, 'n8n', 'code', file), 'utf8');
  code = code.replaceAll('__TAG_SLUGS__', JSON.stringify(tagSlugs));
  if (testMode) {
    code = code.replaceAll('__WHATSAPP_TO__', '910000000000').replaceAll('__OPENWA_SESSION__', 'dry-run');
  } else {
    code = code.replaceAll('__WHATSAPP_TO__', '').replaceAll('__OPENWA_SESSION__', '');
  }
  return code;
}

/** Stable UUID-shaped node ids, so rebuilding doesn't churn the JSON. */
function nodeId(workflow, name) {
  const hex = createHash('sha1').update(`${workflow}:${name}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function builder(workflow) {
  const nodes = [];
  const connections = {};
  const add = (name, type, typeVersion, position, parameters, extra = {}) => {
    nodes.push({ id: nodeId(workflow, name), name, type, typeVersion, position, parameters, ...extra });
    return name;
  };
  const connect = (...names) => {
    for (let index = 0; index < names.length - 1; index += 1) {
      const from = names[index];
      connections[from] ??= { main: [[]] };
      connections[from].main[0].push({ node: names[index + 1], type: 'main', index: 0 });
    }
  };
  const code = (name, file, position, extra) =>
    add(name, 'n8n-nodes-base.code', 2, position, { mode: 'runOnceForAllItems', jsCode: loadCode(file) }, extra);
  const http = (name, position, parameters, extra) => add(name, 'n8n-nodes-base.httpRequest', 4.2, position, parameters, extra);
  return { nodes, connections, add, connect, code, http };
}

const cfg = (field) => `$('Config').first().json.${field}`;
const repoApi = `https://api.github.com/repos/{{ ${cfg('githubOwner')} }}/{{ ${cfg('githubRepo')} }}`;
const githubHeaders = (accept = 'application/vnd.github+json') => ({
  sendHeaders: true,
  headerParameters: {
    parameters: [
      { name: 'Accept', value: accept },
      { name: 'X-GitHub-Api-Version', value: '2022-11-28' },
    ],
  },
});
const githubAuth = { authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi' };
const ollamaCall = (timeout) => ({
  method: 'POST',
  url: `={{ ${cfg('ollamaUrl')} }}/api/chat`,
  sendBody: true,
  specifyBody: 'json',
  jsonBody: '={{ JSON.stringify($json.request) }}',
  options: { timeout, batching: { batch: { batchSize: 1, batchInterval: 0 } } },
});
const githubWrite = testMode ? { disabled: true } : {};

// ─── Daily digest ─────────────────────────────────────────────────────────────
const d = builder('daily-digest');
const Y = 300;
let x = 0;
const next = () => (x += 240);

d.add('Setup notes', 'n8n-nodes-base.stickyNote', 1, [-40, -260], {
  width: 620,
  height: 220,
  color: 4,
  content: [
    '## Pixel Wires · Daily digest',
    '1. Open **Config** and fill in `whatsappTo` and `openwaSessionId`.',
    '2. Select your **GitHub** credential in the 6 GitHub nodes and your **OpenWA API key** credential in **Send WhatsApp**.',
    '3. Click **Execute workflow** to test, then switch the workflow **Active**.',
    'Runs daily at 07:00 Asia/Kolkata. Failures send a WhatsApp alert via *Pixel Wires · Digest failure alert*.',
  ].join('\n'),
});
d.add('Every day 07:00', 'n8n-nodes-base.scheduleTrigger', 1.2, [x, Y - 100], {
  rule: { interval: [{ field: 'cronExpression', expression: '0 7 * * *' }] },
});
d.add('Run manually', 'n8n-nodes-base.manualTrigger', 1, [x, Y + 100], {});
const config = d.code('Config', 'config.js', [next(), Y]);
d.connect('Every day 07:00', config);
d.connect('Run manually', config);

const fetchDev = d.http(
  'Fetch DEV top posts',
  [next(), Y],
  { method: 'GET', url: `=https://dev.to/api/articles?top=1&per_page={{ $json.postsPerSource }}`, options: { timeout: 20000 } },
  { onError: 'continueRegularOutput', alwaysOutputData: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 },
);
const fetchHn = d.http(
  'Fetch HN front page',
  [next(), Y],
  {
    method: 'GET',
    url: `=https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage={{ ${cfg('postsPerSource')} }}`,
    options: { timeout: 20000 },
  },
  { executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 },
);
const normalize = d.code('Normalize posts', 'normalize-posts.js', [next(), Y]);
const scoreReq = d.code('Build scoring requests', 'build-score-requests.js', [next(), Y]);
const score = d.http('Score posts (qwen3.5:4b)', [next(), Y], ollamaCall(180000), {
  onError: 'continueRegularOutput',
  retryOnFail: true,
  maxTries: 2,
  waitBetweenTries: 3000,
});
const pick = d.code('Pick candidates', 'pick-candidates.js', [next(), Y]);
const fetchPages = d.http(
  'Fetch article pages',
  [next(), Y],
  {
    method: 'GET',
    url: '={{ $json.url }}',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'User-Agent', value: 'PixelWiresDigest/1.0 (+https://pixelwire.vercel.app)' },
        { name: 'Accept', value: 'text/html,application/xhtml+xml' },
      ],
    },
    options: {
      timeout: 15000,
      response: { response: { responseFormat: 'text', outputPropertyName: 'data' } },
      batching: { batch: { batchSize: 4, batchInterval: 0 } },
    },
  },
  { onError: 'continueRegularOutput' },
);
const summaryReq = d.code('Build summary requests', 'build-summary-requests.js', [next(), Y]);
const summarize = d.http('Summarize (qwen3:8b)', [next(), Y], ollamaCall(180000), {
  onError: 'continueRegularOutput',
  retryOnFail: true,
  maxTries: 2,
  waitBetweenTries: 3000,
});
const editorReq = d.code('Build editor request', 'build-editor-request.js', [next(), Y]);
const editor = d.http('Pick top posts (gemma4:12b)', [next(), Y], ollamaCall(300000), {
  onError: 'continueRegularOutput',
  retryOnFail: true,
  maxTries: 2,
  waitBetweenTries: 5000,
});
const digest = d.code('Build digest', 'build-digest.js', [next(), Y]);

// Second row: publish to GitHub, then notify.
const Y2 = Y + 260;
x = 240 * 12;
const readIndex = d.http(
  'Read digest index',
  [x, Y2],
  {
    method: 'GET',
    url: `=${repoApi}/contents/public/digest/index.json?ref={{ ${cfg('githubBranch')} }}`,
    ...githubAuth,
    ...githubHeaders('application/vnd.github.raw+json'),
    options: { timeout: 20000, response: { response: { responseFormat: 'text', outputPropertyName: 'data' } } },
  },
  { executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true, ...githubWrite },
);
const commitFiles = d.code('Build commit files', 'build-commit-files.js', [(x += 240), Y2]);
const githubRetry = { executeOnce: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 5000, ...githubWrite };
const getRef = d.http(
  'Get branch ref',
  [(x += 240), Y2],
  { method: 'GET', url: `=${repoApi}/git/ref/heads/{{ ${cfg('githubBranch')} }}`, ...githubAuth, ...githubHeaders(), options: { timeout: 20000 } },
  githubRetry,
);
const getCommit = d.http(
  'Get head commit',
  [(x += 240), Y2],
  { method: 'GET', url: `=${repoApi}/git/commits/{{ $json.object.sha }}`, ...githubAuth, ...githubHeaders(), options: { timeout: 20000 } },
  githubRetry,
);
const createTree = d.http(
  'Create tree',
  [(x += 240), Y2],
  {
    method: 'POST',
    url: `=${repoApi}/git/trees`,
    ...githubAuth,
    ...githubHeaders(),
    sendBody: true,
    specifyBody: 'json',
    jsonBody:
      "={{ JSON.stringify({ base_tree: $json.tree.sha, tree: $('Build commit files').first().json.files.map(f => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })) }) }}",
    options: { timeout: 30000 },
  },
  githubRetry,
);
const createCommit = d.http(
  'Create commit',
  [(x += 240), Y2],
  {
    method: 'POST',
    url: `=${repoApi}/git/commits`,
    ...githubAuth,
    ...githubHeaders(),
    sendBody: true,
    specifyBody: 'json',
    jsonBody:
      "={{ JSON.stringify({ message: $('Build commit files').first().json.message, tree: $json.sha, parents: [$('Get branch ref').first().json.object.sha] }) }}",
    options: { timeout: 30000 },
  },
  githubRetry,
);
const updateRef = d.http(
  'Update branch',
  [(x += 240), Y2],
  {
    method: 'PATCH',
    url: `=${repoApi}/git/refs/heads/{{ ${cfg('githubBranch')} }}`,
    ...githubAuth,
    ...githubHeaders(),
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({ sha: $json.sha, force: false }) }}',
    options: { timeout: 30000 },
  },
  githubRetry,
);
const whatsappMsg = d.code('Build WhatsApp message', 'build-whatsapp-message.js', [(x += 240), Y2]);
const sendWhatsapp = d.http(
  'Send WhatsApp',
  [(x += 240), Y2],
  {
    method: 'POST',
    url: `={{ ${cfg('openwaUrl')} }}/api/sessions/{{ encodeURIComponent(${cfg('openwaSessionId')}) }}/messages/send-text`,
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Idempotency-Key', value: '={{ $json.idempotencyKey }}' }] },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({ chatId: $json.chatId, text: $json.text, linkPreview: false }) }}',
    options: { timeout: 30000 },
  },
  { retryOnFail: true, maxTries: 3, waitBetweenTries: 10000, ...(testMode ? { disabled: true } : {}) },
);

d.connect(config, fetchDev, fetchHn, normalize, scoreReq, score, pick, fetchPages, summaryReq, summarize, editorReq, editor, digest);
d.connect(digest, readIndex, commitFiles, getRef, getCommit, createTree, createCommit, updateRef, whatsappMsg, sendWhatsapp);

const dailyDigest = {
  id: DIGEST_ID,
  name: testMode ? 'Pixel Wires · Daily digest (dry run)' : 'Pixel Wires · Daily digest',
  active: false,
  nodes: d.nodes,
  connections: d.connections,
  pinData: {},
  settings: {
    executionOrder: 'v1',
    timezone: 'Asia/Kolkata',
    saveManualExecutions: true,
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    ...(testMode ? {} : { errorWorkflow: ALERT_ID }),
  },
  tags: [],
};

// ─── Failure alert ────────────────────────────────────────────────────────────
const a = builder('digest-failure-alert');
a.add('Alert notes', 'n8n-nodes-base.stickyNote', 1, [-40, -200], {
  width: 520,
  height: 160,
  color: 3,
  content: [
    '## Pixel Wires · Digest failure alert',
    'Runs automatically when the daily digest fails (set as its Error workflow).',
    'Fill in **Build failure alert** and select your **OpenWA API key** credential in **Send failure alert**.',
  ].join('\n'),
});
a.add('When the digest fails', 'n8n-nodes-base.errorTrigger', 1, [0, 100], {});
const alertMsg = a.code('Build failure alert', 'build-failure-alert.js', [240, 100]);
const alertSend = a.http(
  'Send failure alert',
  [480, 100],
  {
    method: 'POST',
    url: '={{ $json.openwaUrl }}/api/sessions/{{ encodeURIComponent($json.openwaSessionId) }}/messages/send-text',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Idempotency-Key', value: '={{ $json.idempotencyKey }}' }] },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({ chatId: $json.chatId, text: $json.text, linkPreview: false }) }}',
    options: { timeout: 30000 },
  },
  { retryOnFail: true, maxTries: 3, waitBetweenTries: 10000 },
);
a.connect('When the digest fails', alertMsg, alertSend);

const failureAlert = {
  id: ALERT_ID,
  name: 'Pixel Wires · Digest failure alert',
  active: false,
  nodes: a.nodes,
  connections: a.connections,
  pinData: {},
  settings: { executionOrder: 'v1', timezone: 'Asia/Kolkata' },
  tags: [],
};

mkdirSync(outDir, { recursive: true });
const write = (file, data) => writeFileSync(join(outDir, file), `${JSON.stringify(data, null, 2)}\n`);
write(testMode ? 'daily-digest-dry-run.json' : 'daily-digest.json', dailyDigest);
if (!testMode) write('digest-failure-alert.json', failureAlert);
console.log(`Wrote ${testMode ? 'dry-run workflow' : 'workflows'} to ${outDir} (${d.nodes.length} + ${a.nodes.length} nodes, ${tagSlugs.length} tags)`);
