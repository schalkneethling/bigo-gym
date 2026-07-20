import { describe, expect, it } from "vitest";
import { SHAPES } from "../src/catalogue";
import { RUNNABLE_EXAMPLES } from "../src/content/runnable";
import { SNIPPETS } from "../src/content/snippets";

describe("refresher content integrity", () => {
  it("gives every catalogue shape a giveaway and a fix", () => {
    for (const shape of SHAPES) {
      expect(shape.giveaway.trim().length, shape.id).toBeGreaterThan(0);
      expect(shape.fix.trim().length, shape.id).toBeGreaterThan(0);
    }
  });

  it("covers every shape with a runnable example", () => {
    for (const shape of SHAPES) {
      expect(RUNNABLE_EXAMPLES[shape.id], shape.id).toBeDefined();
    }
  });

  it("never reuses gym snippets as refresher examples (answer-leak guard)", () => {
    const gymCode = new Set(SNIPPETS.map((s) => s.code.trim()));
    for (const [shapeId, ex] of Object.entries(RUNNABLE_EXAMPLES)) {
      expect(gymCode.has(ex.problem.code.trim()), shapeId).toBe(false);
      expect(gymCode.has(ex.fixed.code.trim()), shapeId).toBe(false);
    }
  });
});
