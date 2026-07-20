import type { ComplexityClass, ShapeId } from "../catalogue";

/**
 * Seed content for BigO-Gym.
 *
 * Adding a snippet is appending an entry here — no markup or component
 * changes needed. Keep `shapeId` and `complexity` drawn from src/catalogue.ts
 * so stats bucketing stays consistent, and keep explanations in the
 * catalogue's register: name the shape, trace the concrete cost, state the
 * fix. Prefer realistic frontend/TypeScript code over abstract algorithmic
 * filler. Revisit this file periodically and add a few fresh snippets per
 * shape so repeat visitors keep reading code instead of recognizing answers.
 */
export interface Snippet {
  id: string;
  language: "typescript" | "javascript";
  code: string;
  complexity: ComplexityClass;
  shapeId: ShapeId;
  explanation: string;
}

export const SNIPPETS: readonly Snippet[] = [
  // Function call inside a loop, where the function's own cost grows with the loop variable
  {
    id: "rolling-average-latency",
    language: "typescript",
    shapeId: "growing-call-in-loop",
    complexity: "O(n²)",
    code: `function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function latencyChartPoints(samples: number[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < samples.length; i++) {
    points.push({ x: i, y: average(samples.slice(0, i + 1)) });
  }
  return points;
}`,
    explanation:
      "Each call to average looks O(1) from the loop, but it re-reads every sample seen so far — slice plus reduce cost i work at step i. Summed over the loop that is 1 + 2 + … + n ≈ n²/2: for 10,000 samples, ~50 million element reads to plot 10,000 points. Carry a running sum forward and divide by i + 1 — one pass, O(n).",
  },
  {
    id: "cumulative-revenue",
    language: "typescript",
    shapeId: "growing-call-in-loop",
    complexity: "O(n²)",
    code: `function sum(values: number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

export function cumulativeRevenue(daily: number[]): number[] {
  return daily.map((_, day) => sum(daily.slice(0, day + 1)));
}`,
    explanation:
      "The map hides the loop, but sum(daily.slice(0, day + 1)) rebuilds the running total from scratch for every day — day 365 re-adds all 365 values. That is the growing-call-in-a-loop pattern at O(n²). Keep an accumulator across iterations: total += daily[day], push total.",
  },
  {
    id: "leaderboard-rank-at-entry",
    language: "typescript",
    shapeId: "growing-call-in-loop",
    complexity: "O(n²)",
    code: `function countHigher(scores: number[], than: number): number {
  return scores.filter((s) => s > than).length;
}

function ranksAtEntry(submissions: Submission[]): number[] {
  return submissions.map((sub, i) => {
    const earlier = submissions.slice(0, i).map((s) => s.score);
    return countHigher(earlier, sub.score) + 1;
  });
}`,
    explanation:
      "countHigher rescans every earlier submission for each new one — the helper's cost grows with the loop index, so the whole thing is O(n²) even though each call reads cleanly. For a 5,000-entry board that is ~12.5 million comparisons. Maintain a sorted structure of scores seen so far and binary-search the insertion point, or accept the pattern deliberately if boards stay tiny.",
  },

  // Nested iteration over the same or a related collection
  {
    id: "orders-join-customers",
    language: "typescript",
    shapeId: "nested-iteration",
    complexity: "O(n²)",
    code: `function withCustomerNames(
  orders: Order[],
  customers: Customer[],
): OrderRow[] {
  return orders.map((order) => ({
    ...order,
    customerName:
      customers.find((c) => c.id === order.customerId)?.name ?? "Unknown",
  }));
}`,
    explanation:
      "customers.find is a linear scan sitting inside the map — nested iteration over related collections. 2,000 orders against 5,000 customers is up to 10 million id comparisons on every render of this table. Build a Map from customer id to name once before the map, then each row is a single O(1) lookup.",
  },
  {
    id: "dedupe-posts-some",
    language: "typescript",
    shapeId: "nested-iteration",
    complexity: "O(n²)",
    code: `function mergeFeeds(cached: Post[], incoming: Post[]): Post[] {
  const merged = [...cached];
  for (const post of incoming) {
    const exists = merged.some((p) => p.id === post.id);
    if (!exists) {
      merged.push(post);
    }
  }
  return merged;
}`,
    explanation:
      "merged.some rescans the growing merged array for every incoming post — a loop inside a loop over related collections. Merging two 1,000-post feeds costs on the order of a million id checks, and it gets worse as the merged list grows. Seed a Set of ids from cached, check the Set, and add to it as you push.",
  },
  {
    id: "team-roster-audit",
    language: "typescript",
    shapeId: "nested-iteration",
    complexity: "O(n³) or worse",
    code: `function inactiveMembersByTeam(
  teams: Team[],
  allUsers: User[],
): Report[] {
  return teams.map((team) => ({
    teamId: team.id,
    inactive: team.memberIds
      .map((id) => allUsers.find((u) => u.id === id))
      .filter((u) => u !== undefined && !u.active)
      .map((u) => u!.name),
  }));
}`,
    explanation:
      "Three levels deep: for every team, for every member, allUsers.find scans the whole user list. 200 teams × 50 members × 10,000 users is 100 million comparisons for one report. One Map of user id to user, built once before the outer map, collapses the innermost scan to O(1) and the whole job to a straightforward pass over teams and members.",
  },

  // Recomputation of an invariant value inside a hot loop
  {
    id: "regex-per-line",
    language: "typescript",
    shapeId: "invariant-recomputation",
    complexity: "O(n)",
    code: `function highlightMatches(lines: string[], term: string): string[] {
  return lines.map((line) => {
    const pattern = new RegExp(\`(\${escapeRegex(term)})\`, "gi");
    return line.replace(pattern, "<mark>$1</mark>");
  });
}`,
    explanation:
      "The RegExp is compiled from the same term on every line — recomputation of an invariant inside the hot path. Still O(n) overall, but you pay a regex compile per line instead of once: on a 50,000-line log view that is 49,999 wasted compiles, pure constant-factor drag. Hoist the pattern above the map.",
  },
  {
    id: "formatter-per-row",
    language: "typescript",
    shapeId: "invariant-recomputation",
    complexity: "O(n)",
    code: `function formatInvoiceRows(rows: InvoiceRow[]): string[][] {
  return rows.map((row) => {
    const currency = new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    });
    return [row.description, currency.format(row.amountCents / 100)];
  });
}`,
    explanation:
      "Intl.NumberFormat construction is expensive — it loads locale data — and nothing about it varies per row. This is invariant recomputation in a hot loop: asymptotically still O(n), but the constant is brutal, and it is the same instinct as not calling querySelector per iteration. Create the formatter once above the map.",
  },
  {
    id: "active-ids-per-notification",
    language: "typescript",
    shapeId: "invariant-recomputation",
    complexity: "O(n²)",
    code: `function deliverable(
  notifications: AppNotification[],
  users: User[],
): AppNotification[] {
  return notifications.filter((notification) => {
    const activeIds = users
      .filter((u) => u.active)
      .map((u) => u.id);
    return activeIds.includes(notification.userId);
  });
}`,
    explanation:
      "activeIds does not depend on the notification, yet it is rebuilt — two full passes over users — inside every filter callback. 10,000 notifications × 5,000 users is 50 million user visits for a value that never changes: recomputed invariant, and the recomputation cost turns O(n) into O(n²). Build activeIds once above the filter (as a Set, while you are there).",
  },

  // String concatenation accumulating across many iterations
  {
    id: "csv-export-concat",
    language: "typescript",
    shapeId: "string-concatenation",
    complexity: "O(n²)",
    code: `function toCsv(rows: MetricRow[]): string {
  let csv = "timestamp,name,value\\n";
  for (const row of rows) {
    csv += \`\${row.timestamp},\${row.name},\${row.value}\\n\`;
  }
  return csv;
}`,
    explanation:
      'Strings are immutable, so csv += copies everything accumulated so far on each append — total work grows with the square of output size. Exporting 100,000 metric rows re-copies megabytes of prefix thousands of times over. Push each line into an array and join("\\n") once at the end.',
  },
  {
    id: "html-list-concat",
    language: "typescript",
    shapeId: "string-concatenation",
    complexity: "O(n²)",
    code: `function renderResultList(results: SearchResult[]): string {
  let html = "<ul>";
  for (const result of results) {
    html += \`<li><a href="\${result.url}">\${result.title}</a></li>\`;
  }
  return html + "</ul>";
}`,
    explanation:
      "Every += re-copies the whole markup built so far before appending one <li> — the accumulating-concatenation pattern, O(n²) in the length of the output. Collect the <li> strings in an array and join once; better still, build real elements or use a template instead of assembling HTML by string at all.",
  },
  {
    id: "audit-log-concat",
    language: "typescript",
    shapeId: "string-concatenation",
    complexity: "O(n²)",
    code: `function formatAuditTrail(events: AuditEvent[]): string {
  let out = "";
  for (const event of events) {
    out +=
      new Date(event.at).toISOString() +
      " " +
      event.actor +
      " " +
      event.action +
      "\\n";
  }
  return out;
}`,
    explanation:
      'Same pattern as building CSV with +=: each iteration copies the entire accumulated trail to append one line, so a 50,000-event trail does on the order of a billion character copies. Map each event to its line and join("\\n") once — the date formatting stays, the quadratic copying goes.',
  },

  // Sorting inside a loop, or sorting when a single pass would answer the question
  {
    id: "slowest-endpoint-sort",
    language: "typescript",
    shapeId: "sorting-in-loop",
    complexity: "O(n log n)",
    code: `function slowestEndpoint(timings: Timing[]): Timing | undefined {
  const ranked = [...timings].sort((a, b) => b.durationMs - a.durationMs);
  return ranked[0];
}`,
    explanation:
      "A full O(n log n) sort — plus an O(n) copy — to answer a question a single pass answers: which element has the largest durationMs. Only the max is ever read; the other n − 1 positions of the sorted order are thrown away. One reduce keeping the running max is O(n), and had this sat inside a render loop the sort would multiply instead of add.",
  },
  {
    id: "latest-message-sort",
    language: "typescript",
    shapeId: "sorting-in-loop",
    complexity: "O(n log n)",
    code: `function latestMessagePreview(threads: Thread[]): Preview[] {
  return threads.map((thread) => {
    const newest = [...thread.messages].sort(
      (a, b) => b.sentAt - a.sentAt,
    )[0];
    return { threadId: thread.id, snippet: newest?.body.slice(0, 80) };
  });
}`,
    explanation:
      "This is the sort-inside-a-loop giveaway literally: every thread copies and fully sorts its messages just to read one element, the newest. Per thread that is O(m log m) for a question a running max answers in O(m); across an inbox it is the difference between scanning messages once and re-sorting on every render. Reduce to the max sentAt per thread instead.",
  },
  {
    id: "top-products-sort",
    language: "typescript",
    shapeId: "sorting-in-loop",
    complexity: "O(n log n)",
    code: `function topSellers(products: Product[]): Product[] {
  const bySales = [...products].sort((a, b) => b.unitsSold - a.unitsSold);
  return bySales.slice(0, 3);
}`,
    explanation:
      "Sorting the full 50,000-product catalogue to keep three of them — the sort answers a much bigger question than the one asked. O(n log n) where a single pass holding the current top three is O(n). At three, the fix is a few comparisons per product; for larger k, a bounded heap. Whether this matters depends on catalogue size and call frequency — in a hot search-results path it does.",
  },

  // Rebuilding a collection every pass instead of reusing or mutating one
  {
    id: "reduce-spread-array",
    language: "typescript",
    shapeId: "rebuilding-collection",
    complexity: "O(n²)",
    code: `function normalizeEvents(raw: RawEvent[]): AppEvent[] {
  return raw.reduce<AppEvent[]>(
    (acc, event) => [
      ...acc,
      { id: event.id, at: new Date(event.ts), kind: event.type },
    ],
    [],
  );
}`,
    explanation:
      "[...acc, item] allocates a brand-new array and copies every element accumulated so far, once per event — rebuilding the collection every pass. 20,000 events means ~200 million element copies for what a plain map does in one allocation. This is map wearing a reduce costume: raw.map(...) — or if reduce genuinely fits, acc.push(item); return acc.",
  },
  {
    id: "reduce-spread-object",
    language: "typescript",
    shapeId: "rebuilding-collection",
    complexity: "O(n²)",
    code: `function usersById(users: User[]): Record<string, User> {
  return users.reduce(
    (acc, user) => ({ ...acc, [user.id]: user }),
    {} as Record<string, User>,
  );
}`,
    explanation:
      "{ ...acc } copies every key gathered so far to add one more — a fresh object per user, O(n²) total. Indexing 10,000 users this way copies ~50 million entries; mutating the accumulator (acc[user.id] = user; return acc) or Object.fromEntries(users.map(...)) is one pass. The spread-in-reduce idiom reads as immutable hygiene but the accumulator was never shared to begin with.",
  },
  {
    id: "concat-in-filter-loop",
    language: "typescript",
    shapeId: "rebuilding-collection",
    complexity: "O(n²)",
    code: `function visibleRows(rows: Row[], filters: RowFilter[]): Row[] {
  let visible: Row[] = [];
  for (const row of rows) {
    if (filters.every((f) => f(row))) {
      visible = visible.concat([row]);
    }
  }
  return visible;
}`,
    explanation:
      "concat does not append in place — it allocates a new array and copies all previously kept rows, every time a row passes the filters. With most of a 10,000-row table visible, that is tens of millions of copies to build one list. visible.push(row) keeps the single accumulator; the filters.every call is fine.",
  },

  // Redundant DOM queries or forced reflows inside a loop
  {
    id: "cart-total-query-in-loop",
    language: "typescript",
    shapeId: "dom-queries-in-loop",
    complexity: "O(n²)",
    code: `function refreshCartBadges(items: CartItem[]): void {
  for (const item of items) {
    const badge = document
      .querySelectorAll(".cart-item-badge")
      .item(item.index) as HTMLElement;
    badge.textContent = String(item.quantity);
    const total = document.querySelector(".cart-total")!;
    total.textContent = formatTotal(items);
  }
}`,
    explanation:
      "querySelectorAll re-walks the DOM for every item, and .cart-total — which never moves — is re-queried per iteration too; formatTotal(items) even recomputes the same total n times. Each query costs work proportional to document size, so n items against a d-node document is O(n·d). Query both once before the loop, index into a cached NodeList, and set the total once after it.",
  },
  {
    id: "layout-thrash-measure",
    language: "typescript",
    shapeId: "dom-queries-in-loop",
    complexity: "O(n²)",
    code: `function equalizeCardHeights(cards: HTMLElement[]): void {
  let tallest = 0;
  for (const card of cards) {
    card.style.height = "auto";
    tallest = Math.max(tallest, card.offsetHeight);
  }
  for (const card of cards) {
    card.style.height = \`\${tallest}px\`;
  }
}`,
    explanation:
      "Writing style.height then reading offsetHeight in the same iteration forces a synchronous layout per card — the write invalidates layout, the read makes the browser recompute it, at a cost that scales with the DOM. Fifty cards is fifty full layouts in one frame: classic layout thrash, effectively O(n·d). Batch the writes (all heights to auto), then batch the reads, then write the final heights — same two loops, reads separated from writes.",
  },
  {
    id: "table-stripe-requery",
    language: "typescript",
    shapeId: "dom-queries-in-loop",
    complexity: "O(n²)",
    code: `function stripeVisibleRows(tableId: string): void {
  const rowCount = document.querySelectorAll(\`#\${tableId} tr\`).length;
  for (let i = 0; i < rowCount; i++) {
    const row = document.querySelectorAll(\`#\${tableId} tr\`)[i]!;
    if (!row.classList.contains("hidden")) {
      row.classList.toggle("stripe", i % 2 === 0);
    }
  }
}`,
    explanation:
      "The same querySelectorAll runs once per row, re-walking the table's subtree each time just to pluck index i — n rows × n-row scans is O(n²) DOM traversal for a class toggle. Run the query once, hold the NodeList, and loop over it. Same instinct as caching any invariant: the row set does not change between iterations.",
  },

  // Repeated membership checks against an array instead of a Set or Map
  {
    id: "dedupe-includes",
    language: "typescript",
    shapeId: "array-membership-checks",
    complexity: "O(n²)",
    code: `function uniqueVisitors(pageViews: PageView[]): string[] {
  const seen: string[] = [];
  for (const view of pageViews) {
    if (!seen.includes(view.visitorId)) {
      seen.push(view.visitorId);
    }
  }
  return seen;
}`,
    explanation:
      "seen.includes scans the whole seen array on every page view — membership checked against an array instead of a Set. A million views with 100,000 distinct visitors runs tens of billions of comparisons; the same loop over a Set (seen.has / seen.add) is O(n) total, one O(1) check per view. Or skip the loop: [...new Set(pageViews.map((v) => v.visitorId))].",
  },
  {
    id: "selected-tags-filter",
    language: "typescript",
    shapeId: "array-membership-checks",
    complexity: "O(n²)",
    code: `function visibleArticles(
  articles: Article[],
  selectedTagIds: string[],
): Article[] {
  return articles.filter((article) =>
    article.tagIds.some((id) => selectedTagIds.includes(id)),
  );
}`,
    explanation:
      "selectedTagIds.includes is an array scan executed for every tag of every article — n articles × t tags × s selected is the membership-check pattern multiplied twice. With 5,000 articles and 50 selected tags that is millions of string comparisons per keystroke of a filter UI. new Set(selectedTagIds) once before the filter turns each check into O(1).",
  },
  {
    id: "unsynced-items-indexof",
    language: "typescript",
    shapeId: "array-membership-checks",
    complexity: "O(n²)",
    code: `function pendingUploads(
  local: Draft[],
  remoteIds: string[],
): Draft[] {
  return local.filter(
    (draft) => remoteIds.indexOf(draft.id) === -1,
  );
}`,
    explanation:
      "indexOf === -1 is includes in older clothing: a linear scan of remoteIds for every local draft, O(n·m) to compute a set difference. Syncing 2,000 drafts against 50,000 remote ids is 100 million comparisons on every sync tick. Build const remote = new Set(remoteIds) once and filter on !remote.has(draft.id).",
  },
];
