/**
 * Canonical taxonomy for the whole app.
 *
 * Shape names are copied verbatim from the schalk-complexity-radar skill's
 * catalogue (SKILL.md). That file is the single source of truth — if the
 * catalogue changes, update these strings to match it, never the other way
 * around. Snippets and stats bucketing both key off these exact strings.
 */

export const COMPLEXITY_CLASSES = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(n³) or worse",
  "O(2^n)",
] as const;

export type ComplexityClass = (typeof COMPLEXITY_CLASSES)[number];

export interface Shape {
  id: ShapeId;
  name: string;
  /** The catalogue's giveaway — what the shape looks like in the wild. */
  giveaway: string;
  /** The catalogue's fix, stated plainly. */
  fix: string;
}

export const SHAPES = [
  {
    id: "growing-call-in-loop",
    name: "Function call inside a loop, where the function's own cost grows with the loop variable",
    giveaway:
      "Something like average(arr.slice(0, i)) called at every step of an n-length loop — roughly O(n²) total work, even though each call looks innocent in isolation.",
    fix: "Carry the relevant running value (a sum, a max, a count) forward across iterations instead of rebuilding it from scratch each time.",
  },
  {
    id: "nested-iteration",
    name: "Nested iteration over the same or a related collection",
    giveaway:
      "A loop inside a loop, especially one scanning for a match (indexOf, includes, a manual for searching another array).",
    fix: "Build a Map or Set once, before the loop, and turn the inner scan into a single lookup.",
  },
  {
    id: "invariant-recomputation",
    name: "Recomputation of an invariant value inside a hot loop",
    giveaway:
      "A regex compiled, a formatted string built, or any derived value that does not actually change between iterations, sitting inside the loop body anyway.",
    fix: "Hoist it above the loop, compute once.",
  },
  {
    id: "string-concatenation",
    name: "String concatenation accumulating across many iterations",
    giveaway: "result += something inside a loop that runs many times.",
    fix: "Push into an array and join once, or build the pieces and compose at the end.",
  },
  {
    id: "sorting-in-loop",
    name: "Sorting inside a loop, or sorting when a single pass would answer the question",
    giveaway:
      "A .sort() call that runs once per iteration, or a sort used just to find a min/max/kth value.",
    fix: "Sort once outside the loop, or replace the sort entirely with a single-pass or heap-based approach if that is all the problem needs.",
  },
  {
    id: "rebuilding-collection",
    name: "Rebuilding a collection every pass instead of reusing or mutating one",
    giveaway:
      "A new array or object literal created inside a loop body when an accumulator declared once outside would do.",
    fix: "Preallocate or maintain a single accumulator.",
  },
  {
    id: "dom-queries-in-loop",
    name: "Redundant DOM queries or forced reflows inside a loop",
    giveaway:
      "querySelector or a layout-reading property read inside a loop that could be read once and cached.",
    fix: "Query once, cache the reference, batch reads separately from writes.",
  },
  {
    id: "array-membership-checks",
    name: "Repeated membership checks against an array instead of a Set or Map",
    giveaway:
      "array.includes(x) or array.indexOf(x) called inside a loop, checked against the same array each time.",
    fix: "Build a Set once, O(1) membership checks from then on.",
  },
] as const satisfies readonly {
  id: string;
  name: string;
  giveaway: string;
  fix: string;
}[];

export type ShapeId = (typeof SHAPES)[number]["id"];

export function shapeName(id: ShapeId): string {
  const shape = SHAPES.find((s) => s.id === id);
  if (!shape) throw new Error(`Unknown shape id: ${id}`);
  return shape.name;
}
