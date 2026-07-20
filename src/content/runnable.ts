import type { ShapeId } from "../catalogue";

/**
 * Runnable, transparently instrumented refresher examples. Each `run` executes
 * the *same algorithm the reader sees*, calling `tick()` once per unit of work,
 * so counting operations is just running it with a counting tick — no eval, no
 * user input, and no timing (these finish in microseconds; the operation
 * *count* is the lesson, and unlike a duration it is exact and reproducible).
 *
 * The examples are drawn from ordinary application code, not puzzles: the
 * `problem` is something an engineer would plausibly write, with a real Big-O
 * trap hiding in idiomatic-looking lines (`problemLines` marks them so the UI
 * can highlight them), and the `fixed` version is the natural rewrite. Each
 * example names the exact `unit` a single tick represents, so the two counts
 * are comparing like with like. A test pins each `run` to its expected count.
 */
export interface Runnable {
  /** Source shown to the reader — the exact algorithm `run` executes. */
  code: string;
  /** Executes the algorithm, calling `tick()` once per unit of work. */
  run: (input: readonly number[], tick: () => void) => void;
}

export interface RunnableExample {
  makeInput: (n: number) => number[];
  minN: number;
  maxN: number;
  defaultN: number;
  problem: Runnable;
  fixed: Runnable;
  /** 1-based line numbers in `problem.code` that carry the Big-O trap. */
  problemLines: number[];
  /** What a single `tick()` represents, e.g. "additions". Plural noun. */
  unit: string;
  /** Singular form of `unit`, used when a count is exactly 1. Defaults to `unit`. */
  unitOne?: string;
  /** One-line explanation of the counts at the current n. */
  caption: (n: number, patternOps: number, fixedOps: number) => string;
}

/** Run a snippet against an input and return how many work units it performed. */
export function countOps(runnable: Runnable, input: readonly number[]): number {
  let ops = 0;
  runnable.run(input, () => {
    ops += 1;
  });
  return ops;
}

/** A deterministic, scrambled input so examples that sort do real work. */
const scrambled = (n: number): number[] => Array.from({ length: n }, (_, i) => (i * 37) % 100);

/**
 * Running average of a price series — a real reporting/charting need ("show the
 * average price up to each point"). The obvious way is the textbook definition
 * of an average applied at each step: sum everything seen so far, divide by how
 * many. It reads cleanly and is correct — but re-summing the whole prefix every
 * step is O(n²). The fix keeps a running total, turning it into one pass.
 */
const growingCall: RunnableExample = {
  makeInput: scrambled,
  minN: 2,
  maxN: 100,
  defaultN: 12,
  problem: {
    code: `function runningAverages(prices) {
  const averages = [];
  for (let i = 0; i < prices.length; i++) {
    // average of every price seen so far
    const seen = prices.slice(0, i + 1);
    const total = seen.reduce((sum, price) => sum + price, 0);
    averages.push(total / seen.length);
  }
  return averages;
}`,
    run: (prices, tick) => {
      const averages: number[] = [];
      for (let i = 0; i < prices.length; i++) {
        const seen = prices.slice(0, i + 1);
        const total = seen.reduce((sum, price) => {
          tick(); // one addition per price re-summed
          return sum + price;
        }, 0);
        averages.push(total / seen.length);
      }
    },
  },
  fixed: {
    code: `function runningAverages(prices) {
  const averages = [];
  let total = 0;
  for (let i = 0; i < prices.length; i++) {
    total += prices[i];
    averages.push(total / (i + 1));
  }
  return averages;
}`,
    run: (prices, tick) => {
      const averages: number[] = [];
      let total = 0;
      for (let i = 0; i < prices.length; i++) {
        tick(); // one addition per price
        total += prices[i];
        averages.push(total / (i + 1));
      }
    },
  },
  // slice + reduce both re-scan the whole prefix on every iteration.
  problemLines: [5, 6],
  unit: "additions",
  caption: (n, patternOps, fixedOps) =>
    `At n = ${n}, the pattern adds up ${patternOps.toLocaleString()} numbers: it re-sums every price seen so far on each step, so the work grows with 1 + 2 + … + ${n} = ${n} × ${n + 1} ÷ 2. The fix keeps a running total and adds each price once — ${fixedOps.toLocaleString()} in all.`,
};

/**
 * Comment counts for a forum index — for each post, count its comments. The
 * obvious `comments.filter(...)` re-scans every comment for every post, so it
 * is O(posts × comments). Grouping the comments once with a Map turns it into
 * a single pass.
 */
const nestedIteration: RunnableExample = {
  makeInput: scrambled,
  minN: 2,
  maxN: 40,
  defaultN: 8,
  problem: {
    code: `function withCommentCounts(posts, comments) {
  return posts.map((post) => {
    const mine = comments.filter((c) => c.postId === post.id);
    return { ...post, count: mine.length };
  });
}`,
    run: (input, tick) => {
      const posts = input.map((id) => ({ id }));
      const comments = input.map((id) => ({ postId: id }));
      posts.map((post) => {
        // filter examines every comment, once per post
        const mine = comments.filter((c) => {
          tick();
          return c.postId === post.id;
        });
        return mine.length;
      });
    },
  },
  fixed: {
    code: `function withCommentCounts(posts, comments) {
  const counts = new Map();
  for (const c of comments) {
    counts.set(c.postId, (counts.get(c.postId) ?? 0) + 1);
  }
  return posts.map((post) => ({ ...post, count: counts.get(post.id) ?? 0 }));
}`,
    run: (input, tick) => {
      const comments = input.map((id) => ({ postId: id }));
      const counts = new Map<number, number>();
      for (const c of comments) {
        tick(); // each comment examined once, then posts just read the total
        counts.set(c.postId, (counts.get(c.postId) ?? 0) + 1);
      }
    },
  },
  problemLines: [3],
  unit: "comment checks",
  caption: (n, patternOps, fixedOps) =>
    `At ${n} posts and ${n} comments, the pattern checks a comment ${patternOps.toLocaleString()} times — it re-scans all ${n} comments for every post (${n} × ${n}). Grouping the comments once looks at each comment a single time: ${fixedOps.toLocaleString()} in all.`,
};

/**
 * Filtering rows by a search term — the term never changes, but the pattern
 * compiles a fresh regular expression inside every iteration. Hoisting it above
 * the loop compiles it exactly once, no matter how long the list is.
 */
const invariantRecomputation: RunnableExample = {
  makeInput: scrambled,
  minN: 2,
  maxN: 40,
  defaultN: 8,
  problem: {
    code: `function search(rows, term) {
  const matches = [];
  for (const row of rows) {
    const re = new RegExp(term, "i");
    if (re.test(row.title)) matches.push(row);
  }
  return matches;
}`,
    run: (input, tick) => {
      for (const _row of input) {
        tick(); // a fresh RegExp compiled on every iteration
      }
    },
  },
  fixed: {
    code: `function search(rows, term) {
  const re = new RegExp(term, "i");
  return rows.filter((row) => re.test(row.title));
}`,
    run: (_input, tick) => {
      tick(); // compiled once, before the loop
    },
  },
  problemLines: [4],
  unit: "regex compilations",
  unitOne: "regex compilation",
  caption: (n, patternOps, fixedOps) =>
    `At n = ${n} rows, the pattern compiles the same regular expression ${patternOps.toLocaleString()} times — once inside every iteration, though the term never changes. Hoisting it above the loop compiles it just ${fixedOps.toLocaleString()} time, whatever the row count.`,
};

/**
 * Building a text report by `report += line`. Each `+=` produces a brand-new
 * string holding everything already accumulated, so the characters copied grow
 * quadratically. Collecting the pieces in an array and joining once copies each
 * line a single time.
 */
const stringConcatenation: RunnableExample = {
  makeInput: scrambled,
  minN: 2,
  maxN: 100,
  defaultN: 12,
  problem: {
    code: `function buildReport(lines) {
  let report = "";
  for (const line of lines) {
    report += line + "\\n";
  }
  return report;
}`,
    run: (input, tick) => {
      let report = "";
      for (let i = 0; i < input.length; i++) {
        // += rebuilds report: every line already in it is copied again
        for (let already = 0; already <= i; already++) tick();
        report += String(input[i]);
      }
    },
  },
  fixed: {
    code: `function buildReport(lines) {
  const parts = [];
  for (const line of lines) {
    parts.push(line);
  }
  return parts.join("\\n");
}`,
    run: (input, tick) => {
      const parts: string[] = [];
      for (const line of input) {
        tick(); // each line handled once, joined at the end
        parts.push(String(line));
      }
      parts.join("\n");
    },
  },
  problemLines: [4],
  unit: "line copies",
  caption: (n, patternOps, fixedOps) =>
    `At n = ${n} lines, the += pattern copies ${patternOps.toLocaleString()} lines in total: each += builds a new string containing every line already added, so the copies pile up as 1 + 2 + … + ${n}. Collecting the lines and joining once copies each line a single time — ${fixedOps.toLocaleString()} in all.`,
};

/**
 * Finding the cheapest offer. Sorting the whole list just to read its first
 * element does O(n log n) comparisons; a single scan finds the minimum in
 * n comparisons and never needs the rest ordered. (Bespoke instrumentation:
 * the counter is wired into the real `.sort()` comparator, so the pattern's
 * count is exactly the comparisons the engine's sort performs.)
 */
const sortingInLoop: RunnableExample = {
  makeInput: scrambled,
  // Below ~4 items a comparison sort can do fewer comparisons than a single
  // scan (and tiny-n counts are erratic across engines), which would make the
  // fix look worse than the pattern; start high enough that sorting clearly costs more.
  minN: 6,
  maxN: 60,
  defaultN: 12,
  problem: {
    code: `function cheapestOffer(offers) {
  const sorted = [...offers].sort((a, b) => a.price - b.price);
  return sorted[0];
}`,
    run: (input, tick) => {
      [...input].sort((a, b) => {
        tick(); // one comparison per pair the sort weighs
        return a - b;
      });
    },
  },
  fixed: {
    code: `function cheapestOffer(offers) {
  let cheapest = offers[0];
  for (const offer of offers) {
    if (offer.price < cheapest.price) cheapest = offer;
  }
  return cheapest;
}`,
    run: (input, tick) => {
      let cheapest = input[0];
      for (const offer of input) {
        tick(); // one comparison per offer
        if (offer < cheapest) cheapest = offer;
      }
    },
  },
  problemLines: [2],
  unit: "comparisons",
  caption: (n, patternOps, fixedOps) =>
    `At n = ${n} offers, sorting first weighs ${patternOps.toLocaleString()} comparisons just to read the smallest afterwards. A single scan finds the same answer in ${fixedOps.toLocaleString()} — sorting orders the entire list when you only needed its minimum.`,
};

/**
 * Collecting ids with `ids = [...ids, id]`. The spread copies the whole array
 * every iteration (common in reducers and React state updates), so the copies
 * grow quadratically. Pushing into one array touches each id once.
 */
const rebuildingCollection: RunnableExample = {
  makeInput: scrambled,
  minN: 2,
  maxN: 100,
  defaultN: 12,
  problem: {
    code: `function collectIds(items) {
  let ids = [];
  for (const item of items) {
    ids = [...ids, item.id];
  }
  return ids;
}`,
    run: (input, tick) => {
      let ids: number[] = [];
      for (const item of input) {
        // [...ids, id] copies every id already collected, then adds one
        for (const _already of ids) tick();
        tick();
        ids = [...ids, item];
      }
    },
  },
  fixed: {
    code: `function collectIds(items) {
  const ids = [];
  for (const item of items) {
    ids.push(item.id);
  }
  return ids;
}`,
    run: (input, tick) => {
      const ids: number[] = [];
      for (const item of input) {
        tick(); // each id appended once
        ids.push(item);
      }
    },
  },
  problemLines: [4],
  unit: "items copied",
  caption: (n, patternOps, fixedOps) =>
    `At n = ${n} items, the spread pattern copies ${patternOps.toLocaleString()} ids in total: [...ids, id] rebuilds the whole array every iteration, so the copies grow as 1 + 2 + … + ${n}. Pushing into one array touches each id once — ${fixedOps.toLocaleString()} in all.`,
};

/**
 * Sizing cards to their container while reading a layout property inside the
 * loop. Each `offsetHeight` read comes right after a style write, so the browser
 * is forced to re-lay-out the whole page every iteration — layout thrashing, and
 * genuinely O(n²) in the node count. Reading the value once, before the loop,
 * lets the writes batch into a single layout. (Bespoke instrumentation: the
 * counter models the nodes re-laid-out on each forced reflow. A plain
 * `querySelector("#id")` would not do this — an id lookup is hashed, so caching
 * it saves a constant factor, not a complexity class; the cost that actually
 * compounds is a forced reflow.)
 */
const forcedReflowInLoop: RunnableExample = {
  makeInput: scrambled,
  minN: 2,
  maxN: 40,
  defaultN: 8,
  problem: {
    code: `function fillHeights(cards, container) {
  for (const card of cards) {
    card.style.height = container.offsetHeight + "px";
  }
}`,
    run: (input, tick) => {
      const nodes = input.length;
      for (const _card of input) {
        // reading offsetHeight after a write forces a reflow over every node
        for (let node = 0; node < nodes; node++) tick();
      }
    },
  },
  fixed: {
    code: `function fillHeights(cards, container) {
  const height = container.offsetHeight;
  for (const card of cards) {
    card.style.height = height + "px";
  }
}`,
    run: (input, tick) => {
      const nodes = input.length;
      // one forced reflow before the loop; the writes then batch into one layout
      for (let node = 0; node < nodes; node++) tick();
    },
  },
  problemLines: [3],
  unit: "node layouts",
  caption: (n, patternOps, fixedOps) =>
    `On a page of ${n} nodes sizing ${n} cards, the pattern forces ${patternOps.toLocaleString()} node layouts: reading offsetHeight right after each style write makes the browser re-lay-out every node, once per card (${n} × ${n}). Reading the height once, before the loop, lets the writes settle into a single layout — ${fixedOps.toLocaleString()}.`,
};

/**
 * Flagging incoming tags that are not already saved. `saved.includes(tag)`
 * scans the whole saved list for every incoming tag; building a Set once makes
 * each membership check instant.
 */
const arrayMembershipChecks: RunnableExample = {
  makeInput: scrambled,
  minN: 2,
  maxN: 40,
  defaultN: 8,
  problem: {
    code: `function newTags(incoming, saved) {
  return incoming.filter((tag) => !saved.includes(tag));
}`,
    run: (input, tick) => {
      const incoming = input;
      const saved = input.map((v) => v + 1000); // disjoint: nothing is already saved
      incoming.filter((tag) => {
        // includes scans the whole saved list before concluding "not there"
        for (const s of saved) {
          tick();
          if (s === tag) break;
        }
        return true;
      });
    },
  },
  fixed: {
    code: `function newTags(incoming, saved) {
  const savedSet = new Set(saved);
  return incoming.filter((tag) => !savedSet.has(tag));
}`,
    run: (input, tick) => {
      const saved = input.map((v) => v + 1000);
      const savedSet = new Set<number>();
      for (const s of saved) {
        tick(); // each saved tag looked at once while building the Set
        savedSet.add(s);
      }
    },
  },
  problemLines: [2],
  unit: "saved-tag checks",
  caption: (n, patternOps, fixedOps) =>
    `At ${n} incoming and ${n} saved tags, includes checks a saved tag ${patternOps.toLocaleString()} times — it scans the whole saved list for every incoming tag (${n} × ${n}). Building a Set once looks at each saved tag a single time, then every check is instant: ${fixedOps.toLocaleString()} in all.`,
};

/** Every catalogue shape has a runnable example — the compiler enforces it. */
export const RUNNABLE_EXAMPLES: Record<ShapeId, RunnableExample> = {
  "growing-call-in-loop": growingCall,
  "nested-iteration": nestedIteration,
  "invariant-recomputation": invariantRecomputation,
  "string-concatenation": stringConcatenation,
  "sorting-in-loop": sortingInLoop,
  "rebuilding-collection": rebuildingCollection,
  "dom-queries-in-loop": forcedReflowInLoop,
  "array-membership-checks": arrayMembershipChecks,
};
