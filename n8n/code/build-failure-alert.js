// Runs when the daily digest workflow fails: sends a short WhatsApp alert.
// ─── Edit these to match the Config node of the daily digest workflow ───────
const CONFIG = {
  whatsappTo: '__WHATSAPP_TO__',
  openwaSessionId: '__OPENWA_SESSION__',
  openwaUrl: 'http://host.docker.internal:2785',
};
// ──────────────────────────────────────────────────────────────────────────────

if (!/^\d{8,15}$/.test(CONFIG.whatsappTo) || !CONFIG.openwaSessionId || CONFIG.openwaSessionId.startsWith('__')) {
  throw new Error('Failure alert: set whatsappTo and openwaSessionId in this node.');
}

const data = $input.first().json;
const execution = data.execution ?? {};
const error = execution.error ?? {};
const nodeName = error.node?.name ?? execution.lastNodeExecuted ?? 'unknown node';
const message = String(error.message ?? 'Unknown error').slice(0, 500);

const lines = [
  '*Pixel Wires · digest failed*',
  `Workflow: ${data.workflow?.name ?? 'Daily digest'}`,
  `Step: ${nodeName}`,
  `Error: ${message}`,
];
if (execution.url) lines.push(`Details: ${execution.url}`);
lines.push('', "Yesterday's digest stays on the site until the next successful run.");

return [
  {
    json: {
      openwaUrl: CONFIG.openwaUrl,
      openwaSessionId: CONFIG.openwaSessionId,
      chatId: `${CONFIG.whatsappTo}@c.us`,
      text: lines.join('\n'),
      idempotencyKey: `pixelwire-digest-failure-${execution.id ?? Date.now()}`,
    },
  },
];
