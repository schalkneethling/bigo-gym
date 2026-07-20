import type { Snippet } from "../content/snippets";
import type { AttemptRecord } from "./grading";

export interface SelectionOptions {
  /** Snippet to avoid repeating, typically the one just shown. */
  excludeId?: string;
  /** Injectable RNG for deterministic tests. Returns [0, 1). */
  random?: () => number;
}

/**
 * Pick the next snippet: least-attempted first (random among ties), never the
 * one just shown unless it is the only snippet available.
 */
export function pickNextSnippet(
  snippets: readonly Snippet[],
  attempts: readonly AttemptRecord[],
  options: SelectionOptions = {},
): Snippet {
  if (snippets.length === 0) throw new Error("No snippets to pick from");
  const { excludeId, random = Math.random } = options;

  const counts = new Map<string, number>();
  for (const attempt of attempts) {
    counts.set(attempt.snippetId, (counts.get(attempt.snippetId) ?? 0) + 1);
  }

  const eligible = snippets.filter((s) => s.id !== excludeId);
  const pool = eligible.length > 0 ? eligible : snippets;
  const minCount = Math.min(...pool.map((s) => counts.get(s.id) ?? 0));
  const leastAttempted = pool.filter((s) => (counts.get(s.id) ?? 0) === minCount);
  return leastAttempted[Math.floor(random() * leastAttempted.length)]!;
}
