import { SHAPES, type ShapeId } from "../catalogue";
import type { AttemptRecord } from "./grading";

export interface ShapeStats {
  shapeId: ShapeId;
  attempts: number;
  complexityCorrect: number;
  shapeCorrect: number;
}

/**
 * Bucket attempts by the snippet's actual shape, one bucket per catalogue
 * shape in catalogue order. Shapes with zero attempts stay in the result so
 * under-practiced shapes remain visible, not just poorly-scoring ones.
 */
export function bucketByShape(attempts: readonly AttemptRecord[]): ShapeStats[] {
  const buckets = new Map<ShapeId, ShapeStats>(
    SHAPES.map((shape) => [
      shape.id,
      { shapeId: shape.id, attempts: 0, complexityCorrect: 0, shapeCorrect: 0 },
    ]),
  );
  for (const attempt of attempts) {
    const bucket = buckets.get(attempt.actualShapeId);
    if (!bucket) continue;
    bucket.attempts += 1;
    if (attempt.complexityCorrect) bucket.complexityCorrect += 1;
    if (attempt.shapeCorrect) bucket.shapeCorrect += 1;
  }
  return [...buckets.values()];
}
