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

/**
 * Resolve the Storage to use. Merely *touching* `localStorage` throws in some
 * contexts (sandboxed iframes, opaque origins, strict privacy settings), so the
 * access itself has to be guarded — not just later reads/writes. Returns null
 * when Web Storage is unavailable, letting callers degrade to an in-memory list.
 */
function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/**
 * Read all attempts for this visitor. Corrupt data, missing data, or blocked
 * Web Storage all yield [] — never a throw, so a card can render even where
 * persistence is unavailable.
 */
export function loadAttempts(storage?: Storage): AttemptRecord[] {
  const store = resolveStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAttemptRecord);
  } catch {
    return [];
  }
}

/**
 * Append one attempt and persist. Returns the updated list. When Web Storage is
 * blocked the write is skipped silently, so the caller still gets the updated
 * in-memory list for the current session.
 */
export function saveAttempt(record: AttemptRecord, storage?: Storage): AttemptRecord[] {
  const attempts = loadAttempts(storage);
  attempts.push(record);
  const store = resolveStorage(storage);
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Persistence unavailable (blocked or over quota) — keep the in-memory list.
  }
  return attempts;
}
