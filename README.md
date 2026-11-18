# Pixel Wires

A developer news aggregator. It pulls posts from DEV and Hacker News into one
dark, multi-column feed. You can filter by source and tag, search, preview a
post with its comments, and bookmark or upvote posts.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle in dist/
npm run preview    # serve the production bundle
npm test           # unit tests (data layer)
npm run lint
```

Requires Node 20.19 or newer.

## Features

- **Feeds:** *My feed* (newest first) and *Popular* (top posts of the past week), with infinite scroll.
- **Filters:** turn sources on or off and follow up to 12 tags in the collapsible sidebar. Tags work across both
  sources: DEV tags are used directly, and Hacker News titles are matched against keyword patterns.
- **Search:** press <kbd>/</kbd> anywhere. Posts already loaded are filtered instantly as you type; a debounced
  remote search then adds results from the sources. The query lives in the URL (`/search?q=`).
- **Preview drawer:** click any card. You get the full DEV article or the HN text, the top comments, and next/previous
  with <kbd>←</kbd>/<kbd>→</kbd>. Close with <kbd>Esc</kbd>. On phones it opens as a bottom sheet.
- **Bookmarks and upvotes:** saved in this browser (localStorage) with a copy of each post, so their pages work offline.

## How it is built

| Layer | Choice |
|---|---|
| Build | Vite 6, TypeScript (strict) |
| UI | React 18, React Router 6, Tailwind CSS 4, lucide icons |
| Server state | TanStack Query 5 (infinite queries, cancellation, retries) |
| Client state | Zustand 5 with validated persistence |
| Safety | DOMPurify on all third-party HTML |

```
src/
  api/          source adapters (DEV, Hacker News), feed/search aggregation, query client
  components/   layout, sidebar filters, feed cards, preview drawer, UI primitives
  config/       env and source metadata
  hooks/        data hooks (feed, search, article detail) and UI hooks
  lib/          http, text, formatting, tags, search, sanitizing
  routes/       pages
  store/        preferences, bookmarks/upvotes, preview state
  styles/       Tailwind theme tokens and article typography
```

**Adding a source:** write an adapter implementing `SourceAdapter` (`src/api/types.ts`), register it in
`src/api/sources/index.ts`, and add its metadata to `src/config/sources.ts`. The adapter must return
browser-accessible (CORS-enabled) data or go through a proxy.

## Notes and limits

- Both APIs are called directly from the browser; neither needs a key. To add caching or protect against rate
  limits in production, point `VITE_DEVTO_API_BASE` and `VITE_HN_API_BASE` at your own proxy (see `.env.example`).
- DEV's public API has no full-text search, so DEV search results come from tag lookups (single-word queries)
  plus posts already loaded.
- Bookmarks and upvotes don't sync between devices, and upvotes are not sent to DEV or Hacker News.
- It's a single-page app: configure your host to serve `index.html` for unknown paths (e.g. `/popular`, `/search`).
