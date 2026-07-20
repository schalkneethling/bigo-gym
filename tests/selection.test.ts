import { describe, expect, it } from "vitest";
import type { Snippet } from "../src/content/snippets";
import type { AttemptRecord } from "../src/lib/grading";
import { pickNextSnippet } from "../src/lib/selection";

const snippets: Snippet[] = ["a", "b", "c"].map((id) => ({
  id,
  language: "typescript",
  code: "",
  complexity: "O(n²)",
  shapeId: "nested-iteration",
  explanation: "",
}));

function attemptFor(snippetId: string): AttemptRecord {
  return {
    snippetId,
    predictedComplexity: "O(n)",
    predictedShapeId: "nested-iteration",
    actualComplexity: "O(n²)",
    actualShapeId: "nested-iteration",
    complexityCorrect: false,
    shapeCorrect: true,
    timestamp: 0,
  };
}

describe("pickNextSnippet", () => {
  it("prefers snippets with the fewest prior attempts", () => {
    const attempts = [attemptFor("a"), attemptFor("b")];
    const picked = pickNextSnippet(snippets, attempts);
    expect(picked.id).toBe("c");
  });

  it("does not show the same snippet twice in a row when others exist", () => {
    for (let i = 0; i < 20; i++) {
      const picked = pickNextSnippet(snippets, [], { excludeId: "b" });
      expect(picked.id).not.toBe("b");
    }
  });

  it("still returns the excluded snippet when it is the only one", () => {
    const picked = pickNextSnippet([snippets[0]!], [], { excludeId: "a" });
    expect(picked.id).toBe("a");
  });
});
