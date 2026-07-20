import type { ComplexityClass, ShapeId } from "../catalogue";
import type { Snippet } from "../content/snippets";

export interface Prediction {
  complexity: ComplexityClass;
  shapeId: ShapeId;
}

export interface AttemptRecord {
  snippetId: string;
  predictedComplexity: ComplexityClass;
  predictedShapeId: ShapeId;
  actualComplexity: ComplexityClass;
  actualShapeId: ShapeId;
  complexityCorrect: boolean;
  shapeCorrect: boolean;
  timestamp: number;
}

/** Grade a prediction against a snippet. The two axes are graded independently. */
export function gradeAttempt(
  snippet: Snippet,
  prediction: Prediction,
  timestamp: number = Date.now(),
): AttemptRecord {
  return {
    snippetId: snippet.id,
    predictedComplexity: prediction.complexity,
    predictedShapeId: prediction.shapeId,
    actualComplexity: snippet.complexity,
    actualShapeId: snippet.shapeId,
    complexityCorrect: prediction.complexity === snippet.complexity,
    shapeCorrect: prediction.shapeId === snippet.shapeId,
    timestamp,
  };
}
