export type SourceId = 'devto' | 'hackernews';

export type FeedMode = 'latest' | 'popular';

export interface ArticleAuthor {
  name: string;
  handle?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

/** One news item, normalized to the same shape whichever source it came from. */
export interface Article {
  /** Globally unique: `${source}:${nativeId}`. */
  id: string;
  source: SourceId;
  /** The id the source itself uses. */
  nativeId: string;
  title: string;
  summary: string | null;
  /** Where "Read article" goes. */
  url: string;
  /** Hostname of `url`, without `www.`. */
  domain: string | null;
  /** The source's own discussion page. */
  discussionUrl: string;
  coverImage: string | null;
  /** Lowercase tag slugs. */
  tags: string[];
  author: ArticleAuthor;
  /** ISO 8601 timestamp. */
  publishedAt: string;
  readingTimeMinutes: number | null;
  /** Reactions (DEV) or points (HN), as reported by the source. */
  score: number;
  commentCount: number;
}

export interface ArticleComment {
  id: string;
  author: string;
  /** Sanitized HTML once it leaves the data layer. */
  html: string;
  createdAt: string;
  replyCount: number;
}

export interface ArticleDetail {
  /** Sanitized HTML once it leaves the data layer. */
  bodyHtml: string | null;
  comments: ArticleComment[];
}

/** What one source returns for one page. */
export interface SourcePage {
  items: Article[];
  hasMore: boolean;
}

/** What the aggregator returns for one page across all enabled sources. */
export interface FeedPage {
  page: number;
  items: Article[];
  hasMore: boolean;
  /** Sources that failed for this page; the rest still rendered. */
  failedSources: SourceId[];
}
