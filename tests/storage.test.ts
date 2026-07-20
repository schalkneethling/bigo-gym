import { describe, expect, it } from "vitest";
import type { AttemptRecord } from "../src/lib/grading";
import { STORAGE_KEY, loadAttempts, saveAttempt } from "../src/lib/storage";

function memoryStorage(seed?: Record<string, string>): Storage {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

const record: AttemptRecord = {
  snippetId: "s1",
  predictedComplexity: "O(n²)",
  predictedShapeId: "nested-iteration",
  actualComplexity: "O(n²)",
  actualShapeId: "nested-iteration",
  complexityCorrect: true,
  shapeCorrect: true,
  timestamp: 1700000000000,
};

describe("attempt storage", () => {
  it("returns an empty list when nothing has been saved", () => {
    expect(loadAttempts(memoryStorage())).toEqual([]);
  });

  it("round-trips saved attempts", () => {
    const storage = memoryStorage();
    saveAttempt(record, storage);
    saveAttempt({ ...record, snippetId: "s2" }, storage);
    const loaded = loadAttempts(storage);
    expect(loaded).toHaveLength(2);
    expect(loaded[0]).toEqual(record);
    expect(loaded[1]?.snippetId).toBe("s2");
  });

  it("recovers from corrupt stored JSON instead of throwing", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "not json{" });
    expect(loadAttempts(storage)).toEqual([]);
    saveAttempt(record, storage);
    expect(loadAttempts(storage)).toEqual([record]);
  });

  it("discards stored values that are not arrays of attempts", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{"nope":true}' });
    expect(loadAttempts(storage)).toEqual([]);
  });

  it("retains attempts in memory across saves when storage is blocked", () => {
    // Sandboxed iframes / opaque origins throw on getItem (and even on access).
    const blocked = {
      get length(): number {
        throw new DOMException("blocked", "SecurityError");
      },
      clear: () => {},
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
      key: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    } as Storage;

    // Reads never throw, and the session fallback accumulates across saves
    // rather than resetting to a single record. Measured relative to a baseline
    // so the shared module-level fallback keeps this order-independent.
    expect(() => loadAttempts(blocked)).not.toThrow();
    const base = loadAttempts(blocked).length;

    expect(() => saveAttempt(record, blocked)).not.toThrow();
    const after = saveAttempt({ ...record, snippetId: "s2" }, blocked);
    expect(after).toHaveLength(base + 2);
    expect(after[after.length - 1]?.snippetId).toBe("s2");
    // A later read sees the retained list, not a fresh empty one.
    expect(loadAttempts(blocked)).toHaveLength(base + 2);
  });
});
