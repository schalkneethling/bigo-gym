import { describe, expect, it } from "vitest";
import { RUNNABLE_EXAMPLES, countOps } from "../src/content/runnable";

describe.each(Object.entries(RUNNABLE_EXAMPLES))("runnable example: %s", (id, ex) => {
  it("has a default n inside its range", () => {
    expect(ex.minN, id).toBeLessThanOrEqual(ex.defaultN);
    expect(ex.defaultN, id).toBeLessThanOrEqual(ex.maxN);
  });

  it("makeInput returns an array of length n", () => {
    expect(ex.makeInput(10)).toHaveLength(10);
    expect(ex.makeInput(3)).toHaveLength(3);
  });

  it("the fix does strictly less work than the pattern, and the gap widens", () => {
    const gap = (n: number) =>
      countOps(ex.problem, ex.makeInput(n)) - countOps(ex.fixed, ex.makeInput(n));
    expect(gap(ex.maxN), id).toBeGreaterThan(0);
    expect(gap(ex.maxN), id).toBeGreaterThan(gap(ex.minN));
  });

  it("flags real offending lines and names the counted unit", () => {
    const lineCount = ex.problem.code.split("\n").length;
    expect(ex.problemLines.length, id).toBeGreaterThan(0);
    for (const line of ex.problemLines) {
      expect(line, `${id} line ${line}`).toBeGreaterThanOrEqual(1);
      expect(line, `${id} line ${line}`).toBeLessThanOrEqual(lineCount);
    }
    expect(ex.unit.trim().length, id).toBeGreaterThan(0);
  });

  it("the caption renders a non-empty string for the default n", () => {
    const input = ex.makeInput(ex.defaultN);
    const patternOps = countOps(ex.problem, input);
    const fixedOps = countOps(ex.fixed, input);
    expect(ex.caption(ex.defaultN, patternOps, fixedOps).trim().length, id).toBeGreaterThan(0);
  });
});

describe("runnable growing-call example", () => {
  const ex = RUNNABLE_EXAMPLES["growing-call-in-loop"];

  it("the pattern re-sums the prefix: n(n+1)/2 additions", () => {
    for (const n of [1, 2, 5, 12, 50]) {
      expect(countOps(ex.problem, ex.makeInput(n)), `n=${n}`).toBe((n * (n + 1)) / 2);
    }
    // The n = 12 case is the one exercised by the e2e test.
    expect(countOps(ex.problem, ex.makeInput(12))).toBe(78);
  });

  it("the fix accumulates: n additions", () => {
    for (const n of [1, 2, 5, 12, 50]) {
      expect(countOps(ex.fixed, ex.makeInput(n)), `n=${n}`).toBe(n);
    }
  });

  it("the shown code matches the run: pattern re-sums, fix accumulates", () => {
    expect(ex.problem.code).toContain(".slice(");
    expect(ex.problem.code).toContain(".reduce(");
    expect(ex.fixed.code).toContain("total +=");
  });
});
