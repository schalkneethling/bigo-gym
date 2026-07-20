import { describe, expect, it } from "vitest";
import type { Snippet } from "../src/content/snippets";
import { gradeAttempt } from "../src/lib/grading";

const snippet: Snippet = {
  id: "test-snippet",
  language: "typescript",
  code: "for (const x of xs) {}",
  complexity: "O(n²)",
  shapeId: "nested-iteration",
  explanation: "Test explanation.",
};

describe("gradeAttempt", () => {
  it("grades both axes correct when both predictions match", () => {
    const attempt = gradeAttempt(snippet, {
      complexity: "O(n²)",
      shapeId: "nested-iteration",
    });
    expect(attempt.complexityCorrect).toBe(true);
    expect(attempt.shapeCorrect).toBe(true);
  });

  it("grades the axes independently — right complexity, wrong shape", () => {
    const attempt = gradeAttempt(snippet, {
      complexity: "O(n²)",
      shapeId: "string-concatenation",
    });
    expect(attempt.complexityCorrect).toBe(true);
    expect(attempt.shapeCorrect).toBe(false);
  });

  it("grades the axes independently — wrong complexity, right shape", () => {
    const attempt = gradeAttempt(snippet, {
      complexity: "O(n)",
      shapeId: "nested-iteration",
    });
    expect(attempt.complexityCorrect).toBe(false);
    expect(attempt.shapeCorrect).toBe(true);
  });

  it("records what was predicted and what was actual", () => {
    const attempt = gradeAttempt(
      snippet,
      { complexity: "O(n)", shapeId: "sorting-in-loop" },
      1700000000000,
    );
    expect(attempt).toEqual({
      snippetId: "test-snippet",
      predictedComplexity: "O(n)",
      predictedShapeId: "sorting-in-loop",
      actualComplexity: "O(n²)",
      actualShapeId: "nested-iteration",
      complexityCorrect: false,
      shapeCorrect: false,
      timestamp: 1700000000000,
    });
  });
});
