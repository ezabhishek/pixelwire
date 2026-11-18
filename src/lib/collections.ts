/** Keep the first item for each id, preserving order. */
export function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

/** Round-robin merge: a1, b1, a2, b2, ... Keeps each list's own order. */
export function interleave<T>(lists: ReadonlyArray<readonly T[]>): T[] {
  const result: T[] = [];
  const longest = lists.reduce((max, list) => Math.max(max, list.length), 0);
  for (let index = 0; index < longest; index += 1) {
    for (const list of lists) {
      const item = list[index];
      if (item !== undefined) result.push(item);
    }
  }
  return result;
}

export function byPublishedDesc<T extends { publishedAt: string }>(a: T, b: T): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}
