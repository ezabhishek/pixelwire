export interface TagDefinition {
  /** Matches the DEV tag of the same name. */
  slug: string;
  label: string;
  /** Words sent to Hacker News search when this tag is followed. */
  hnTerms: string[];
  /** Patterns that mark an untagged title (HN) as being about this tag. */
  patterns: RegExp[];
}

export const TAG_CATALOG: readonly TagDefinition[] = [
  { slug: 'ai', label: 'AI', hnTerms: ['AI', 'LLM'], patterns: [/\bAI\b/, /\bLLMs?\b/i, /\bGPT-?\d*\b/i, /\bClaude\b/, /\bGemini\b/, /\bagentic\b/i] },
  { slug: 'machinelearning', label: 'Machine Learning', hnTerms: ['machine learning', 'neural'], patterns: [/\bmachine learning\b/i, /\bneural (net|network)s?\b/i, /\bdeep learning\b/i, /\bPyTorch\b/i, /\btransformers?\b/i] },
  { slug: 'javascript', label: 'JavaScript', hnTerms: ['JavaScript'], patterns: [/\bjavascript\b/i, /\bECMAScript\b/i, /\bnpm\b/i, /\bDeno\b/, /\bBun\b/] },
  { slug: 'typescript', label: 'TypeScript', hnTerms: ['TypeScript'], patterns: [/\btypescript\b/i] },
  { slug: 'react', label: 'React', hnTerms: ['React'], patterns: [/\bReact\b/, /\bNext\.js\b/i, /\bJSX\b/] },
  { slug: 'node', label: 'Node.js', hnTerms: ['Node.js'], patterns: [/\bnode\.?js\b/i] },
  { slug: 'css', label: 'CSS', hnTerms: ['CSS'], patterns: [/\bCSS\b/, /\bTailwind\b/i] },
  { slug: 'webdev', label: 'Web Dev', hnTerms: ['web', 'browser'], patterns: [/\bweb ?dev\b/i, /\bbrowsers?\b/i, /\bHTML\b/, /\bWebAssembly\b/i, /\bWASM\b/] },
  { slug: 'python', label: 'Python', hnTerms: ['Python'], patterns: [/\bpython\b/i, /\bDjango\b/i, /\bFastAPI\b/i] },
  { slug: 'rust', label: 'Rust', hnTerms: ['Rust'], patterns: [/\bRust\b/, /\bcargo\b/i] },
  { slug: 'go', label: 'Go', hnTerms: ['Golang'], patterns: [/\bgolang\b/i, /\bGo\s?1\.\d+/, /\bin Go\b/] },
  { slug: 'java', label: 'Java', hnTerms: ['Java', 'JVM'], patterns: [/\bJava\b/, /\bJVM\b/, /\bKotlin\b/] },
  { slug: 'devops', label: 'DevOps', hnTerms: ['DevOps', 'CI'], patterns: [/\bdevops\b/i, /\bCI\/CD\b/i, /\bTerraform\b/i, /\bGitHub Actions\b/i] },
  { slug: 'kubernetes', label: 'Kubernetes', hnTerms: ['Kubernetes'], patterns: [/\bkubernetes\b/i, /\bk8s\b/i, /\bHelm\b/] },
  { slug: 'docker', label: 'Docker', hnTerms: ['Docker', 'container'], patterns: [/\bdocker\b/i, /\bcontainers?\b/i, /\bPodman\b/i] },
  { slug: 'cloud', label: 'Cloud', hnTerms: ['AWS', 'cloud'], patterns: [/\bAWS\b/, /\bAzure\b/, /\bGCP\b/, /\bcloud\b/i, /\bserverless\b/i] },
  { slug: 'security', label: 'Security', hnTerms: ['security', 'vulnerability'], patterns: [/\bsecurity\b/i, /\bvulnerabilit(y|ies)\b/i, /\bCVE-\d+/i, /\bexploit\b/i, /\bmalware\b/i, /\bbreach\b/i] },
  { slug: 'database', label: 'Databases', hnTerms: ['database', 'Postgres', 'SQL'], patterns: [/\bdatabases?\b/i, /\bPostgres(QL)?\b/i, /\bSQLite\b/i, /\bSQL\b/, /\bMySQL\b/i, /\bRedis\b/i] },
  { slug: 'linux', label: 'Linux', hnTerms: ['Linux'], patterns: [/\blinux\b/i, /\bkernel\b/i, /\bUbuntu\b/i, /\bDebian\b/i] },
  { slug: 'opensource', label: 'Open Source', hnTerms: ['open source'], patterns: [/\bopen[- ]source\b/i, /\bGPL\b/, /\bMIT licen[cs]e\b/i] },
  { slug: 'programming', label: 'Programming', hnTerms: ['programming', 'compiler'], patterns: [/\bprogramming\b/i, /\bcompilers?\b/i, /\balgorithms?\b/i] },
  { slug: 'career', label: 'Career', hnTerms: ['career', 'hiring'], patterns: [/\bcareers?\b/i, /\bhiring\b/i, /\binterviews?\b/i, /\blayoffs?\b/i, /\bremote work\b/i] },
];

const TAGS_BY_SLUG = new Map(TAG_CATALOG.map((tag) => [tag.slug, tag]));

export function getTag(slug: string): TagDefinition | undefined {
  return TAGS_BY_SLUG.get(slug);
}

/** A readable label for any slug, including ones outside the catalog. */
export function getTagLabel(slug: string): string {
  return TAGS_BY_SLUG.get(slug)?.label ?? `#${slug}`;
}

export function isKnownTag(slug: string): boolean {
  return TAGS_BY_SLUG.has(slug);
}

const MAX_INFERRED_TAGS = 4;

/** Tag an untagged item (HN titles) by matching the catalog patterns. */
export function inferTags(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const tag of TAG_CATALOG) {
    if (tag.patterns.some((pattern) => pattern.test(text))) {
      found.push(tag.slug);
      if (found.length >= MAX_INFERRED_TAGS) break;
    }
  }
  return found;
}

/** The HN search words for a set of followed tags, deduplicated. */
export function hnTermsForTags(slugs: readonly string[]): string[] {
  const terms = new Set<string>();
  for (const slug of slugs) {
    const tag = TAGS_BY_SLUG.get(slug);
    if (tag) tag.hnTerms.forEach((term) => terms.add(term));
    else terms.add(slug);
  }
  return [...terms];
}

/** Lowercase, keep only characters valid in a DEV tag. */
export function toTagSlug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}
