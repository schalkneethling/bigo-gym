import type { AttemptRecord } from "./grading";

export const STORAGE_KEY = "bigo-gym:attempts";

function isAttemptRecord(value: unknown): value is AttemptRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.snippetId === "string" &&
    typeof record.predictedComplexity === "string" &&
    typeof record.predictedShapeId === "string" &&
    typeof record.actualComplexity === "string" &&
    typeof record.actualShapeId === "string" &&
    typeof record.complexityCorrect === "boolean" &&
    typeof record.shapeCorrect === "boolean" &&
    typeof record.timestamp === "number"
  );
}

/** Read all attempts for this visitor. Corrupt or missing data yields []. */
export function loadAttempts(storage: Storage = localStorage): AttemptRecord[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAttemptRecord);
  } catch {
    return [];
  }
}

/** Append one attempt and persist. Returns the updated list. */
export function saveAttempt(
  record: AttemptRecord,
  storage: Storage = localStorage,
): AttemptRecord[] {
  const attempts = loadAttempts(storage);
  attempts.push(record);
  storage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  return attempts;
}
