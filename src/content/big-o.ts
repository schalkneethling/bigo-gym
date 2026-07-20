import type { ComplexityClass } from "../catalogue";

/**
 * The Big-O primer for the refresher page, one profile per class in the
 * gym's fixed answer set (src/catalogue.ts COMPLEXITY_CLASSES, same order —
 * a test enforces this). Keep it terse and concrete: how the work grows,
 * what that means at a real input size, and where the class shows up in
 * everyday frontend code.
 */
export interface ComplexityProfile {
  complexity: ComplexityClass;
  /** The spoken name for this class, e.g. "linear" for O(n). */
  name: string;
  /** How the work grows as the input grows. */
  growth: string;
  /** A concrete anchor at a realistic input size. */
  atScale: string;
  /** Where this class typically shows up in real code. */
  spotIt: string;
}

export const COMPLEXITY_PROFILES: readonly ComplexityProfile[] = [
  {
    complexity: "O(1)",
    name: "constant time",
    growth: "Flat — the same work no matter how big the input gets.",
    atScale: "n = 1,000 → 1 step",
    spotIt: "Map/Set lookups, array indexing, push/pop, property access.",
  },
  {
    complexity: "O(log n)",
    name: "logarithmic time",
    growth: "Each step discards half of what remains.",
    atScale: "n = 1,000 → ~10 steps",
    spotIt: "Binary search, balanced-tree operations.",
  },
  {
    complexity: "O(n)",
    name: "linear time",
    growth: "One visit per item — doubling the input doubles the work.",
    atScale: "n = 1,000 → 1,000 steps",
    spotIt: "A single loop; map, filter, find, includes — one pass.",
  },
  {
    complexity: "O(n log n)",
    name: "linearithmic time (also called log-linear)",
    growth: "A full pass repeated once per halving level.",
    atScale: "n = 1,000 → ~10,000 steps",
    spotIt: "Good sorting — Array.prototype.sort on real data.",
  },
  {
    complexity: "O(n²)",
    name: "quadratic time",
    growth:
      "Every item against every item, or a per-step cost that grows with the loop — doubling the input quadruples the work.",
    atScale: "n = 1,000 → 1,000,000 steps",
    spotIt: "A loop hiding inside a loop; most of the patterns below land here.",
  },
  {
    complexity: "O(n³) or worse",
    name: "cubic time or worse",
    growth: "Every pair of items, times yet another growing loop.",
    atScale: "n = 1,000 → 1,000,000,000 steps",
    spotIt: "A scan inside a nested loop; three-level joins over collections.",
  },
  {
    complexity: "O(2^n)",
    name: "exponential time",
    growth: "Doubles with every single item added.",
    atScale: "n = 40 → ~1,000,000,000,000 steps",
    spotIt: "Naive recursion that branches per item — exploring every subset or combination.",
  },
];
