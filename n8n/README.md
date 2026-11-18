# Pixel Wires · n8n daily digest

Every morning at **07:00 IST** your local n8n picks the best developer posts with your local
Ollama models, publishes them to the website's **Today** page, and sends you a WhatsApp summary.

```
07:00  n8n (Docker, on this laptop)
  │  fetch 30 DEV top posts + 30 HN front-page stories
  │  qwen3.5:4b   scores every post 1-10 and tags it          (~1-2 min)
  │  keep the best 20
  │  fetch each article page, extract the text
  │  qwen3:8b     writes a two-sentence summary for each       (~1 min)
  │  gemma4:12b   picks the top 10 and writes the intro        (~1 min)
  │  commit public/digest/{date}.json, latest.json, index.json to GitHub (one commit)
  ▼
GitHub main ──► Vercel redeploys (~30 s) ──► pixelwire.vercel.app/today
  │
  └─► OpenWA ──► WhatsApp message: intro, top 5 with links, link to the full page
If any step fails ──► "Digest failure alert" workflow ──► WhatsApp alert
```

Nothing leaves your laptop except the fetches, the GitHub commit and the WhatsApp message;
all AI runs in Ollama.

## Files

| Path | What |
|---|---|
| `n8n/workflows/daily-digest.json` | The workflow to import |
| `n8n/workflows/digest-failure-alert.json` | Sends a WhatsApp message if the digest fails |
| `n8n/code/*.js` | The source of every Code node (prompts and logic live here) |
| `scripts/build-n8n-workflows.mjs` | Builds the workflow JSON from `n8n/code` |

After editing anything in `n8n/code`, run `npm run n8n:build` and import again.

## One-time setup

### 1. Import the workflows

From the project folder:

```bash
docker cp n8n/workflows/. n8n:/tmp/pixelwire/
```

```bash
docker exec n8n n8n import:workflow --separate --input=/tmp/pixelwire/
```

Or in the n8n UI (http://localhost:5678): **Create workflow → ⋯ → Import from file**, once per file.
Importing again replaces the workflows with the same ids, so it's safe to repeat.

### 2. Create two credentials in n8n (Credentials → Add credential)

- **GitHub API**: a fine-grained personal access token from
  https://github.com/settings/personal-access-tokens/new with
  *Repository access → Only select repositories → pixelwire* and
  *Repository permissions → Contents: Read and write*. Nothing else is needed.
- **Header Auth** (name it "OpenWA API key"): Name `X-API-Key`, Value = an API key from the
  OpenWA dashboard (http://localhost:2785).

### 3. Fill in the workflows

In **Pixel Wires · Daily digest**:
- Open **Config** and set `whatsappTo` (country code + number, digits only, e.g. `919876543210`)
  and `openwaSessionId` (OpenWA dashboard → Sessions).
- Select the GitHub credential in the six GitHub nodes (*Read digest index* through *Update branch*).
- Select the OpenWA credential in **Send WhatsApp**.

In **Pixel Wires · Digest failure alert**:
- Set the same `whatsappTo` and `openwaSessionId` in **Build failure alert**.
- Select the OpenWA credential in **Send failure alert**.

### 4. Test, then switch on

1. In the digest workflow click **Execute workflow**. It takes about 3-4 minutes; you should get the
   WhatsApp message, and https://pixelwire.vercel.app/today shows the digest about a minute later.
2. Toggle **Pixel Wires · Digest failure alert** to **Active**. (n8n may only allow activating
   workflows with a trigger other than the error trigger; if so, leaving it inactive is fine: it is
   still called as the error workflow.)
3. Toggle **Pixel Wires · Daily digest** to **Active**.

## Good to know

- **The laptop must be on (and Docker, Ollama and OpenWA running) at 07:00.** n8n doesn't make up a
  run it missed; the site keeps showing the last digest. Run it by hand any time with
  **Execute workflow**.
- **Re-running on the same day** replaces that day's digest and sends a new message.
- **Each run is one commit** on `main` ("Daily digest yyyy-mm-dd"), which triggers one Vercel deploy.
- **Tuning** is all in **Config**: models, `minScore`, `topN`, `postsInWhatsApp`, `postsPerSource`.
- **Prompts** are in `n8n/code/build-score-requests.js`, `build-summary-requests.js` and
  `build-editor-request.js`.
- **Summaries are AI-written** and can be wrong; the site says so under every digest.
