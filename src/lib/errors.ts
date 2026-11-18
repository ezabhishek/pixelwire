import { HttpError } from './http';

/** A sentence a reader can act on, for any error the data layer throws. */
export function describeError(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 0) return "Couldn't reach the news sources. Check your connection and try again.";
    if (error.status === 429) return 'The news sources are limiting requests right now. Wait a moment and try again.';
    if (error.status >= 500) return 'A news source is having problems. Try again shortly.';
    if (error.status === 404) return 'That post is no longer available.';
    return `The request failed (HTTP ${error.status}).`;
  }
  return 'Something went wrong while loading posts.';
}
