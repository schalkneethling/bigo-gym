import { describe, expect, it } from "vitest";
import { SHAPES } from "../src/catalogue";
import type { AttemptRecord } from "../src/lib/grading";
import { bucketByShape } from "../src/lib/stats";

function attempt(overrides: Partial<AttemptRecord>): AttemptRecord {
  return {
    snippetId: "s1",
    predictedComplexity: "O(n)",
    predictedShapeId: "nested-iteration",
    actualComplexity: "O(n²)",
    actualShapeId: "nested-iteration",
    complexityCorrect: false,
    shapeCorrect: true,
    timestamp: 0,
    ...overrides,
  };
}

describe("bucketByShape", () => {
  it("returns one bucket per catalogue shape, in catalogue order, even with no attempts", () => {
    const buckets = bucketByShape([]);
    expect(buckets.map((b) => b.shapeId)).toEqual(SHAPES.map((s) => s.id));
    for (const bucket of buckets) {
      expect(bucket.attempts).toBe(0);
      expect(bucket.complexityCorrect).toBe(0);
      expect(bucket.shapeCorrect).toBe(0);
    }
  });

  it("buckets attempts by the snippet's actual shape, not the predicted one", () => {
    const buckets = bucketByShape([
      attempt({
        actualShapeId: "string-concatenation",
        predictedShapeId: "nested-iteration",
        shapeCorrect: false,
      }),
    ]);
    const concat = buckets.find((b) => b.shapeId === "string-concatenation");
    const nested = buckets.find((b) => b.shapeId === "nested-iteration");
    expect(concat?.attempts).toBe(1);
    expect(nested?.attempts).toBe(0);
  });

  it("counts correct predictions per axis within each bucket", () => {
    const buckets = bucketByShape([
      attempt({ complexityCorrect: true, shapeCorrect: true }),
      attempt({ complexityCorrect: true, shapeCorrect: false }),
      attempt({ complexityCorrect: false, shapeCorrect: false }),
    ]);
    const nested = buckets.find((b) => b.shapeId === "nested-iteration");
    expect(nested).toMatchObject({
      attempts: 3,
      complexityCorrect: 2,
      shapeCorrect: 1,
    });
  });
});
