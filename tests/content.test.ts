import { describe, expect, it } from "vitest";
import { COMPLEXITY_CLASSES, SHAPES } from "../src/catalogue";
import { SNIPPETS } from "../src/content/snippets";

describe("snippet content integrity", () => {
  it("has unique snippet ids", () => {
    const ids = SNIPPETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses shape ids and complexity classes from the catalogue", () => {
    const shapeIds = new Set<string>(SHAPES.map((s) => s.id));
    const classes = new Set<string>(COMPLEXITY_CLASSES);
    for (const snippet of SNIPPETS) {
      expect(shapeIds.has(snippet.shapeId), snippet.id).toBe(true);
      expect(classes.has(snippet.complexity), snippet.id).toBe(true);
    }
  });

  it("seeds at least three snippets for every catalogue shape", () => {
    for (const shape of SHAPES) {
      const count = SNIPPETS.filter((s) => s.shapeId === shape.id).length;
      expect(count, shape.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives every snippet non-empty code and a non-empty explanation", () => {
    for (const snippet of SNIPPETS) {
      expect(snippet.code.trim().length, snippet.id).toBeGreaterThan(0);
      expect(snippet.explanation.trim().length, snippet.id).toBeGreaterThan(0);
    }
  });
});
