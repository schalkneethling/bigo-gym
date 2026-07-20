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

  it("falls back to an empty list when the storage access itself throws", () => {
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

    expect(() => loadAttempts(blocked)).not.toThrow();
    expect(loadAttempts(blocked)).toEqual([]);
    // A save must not throw either, and still returns the in-memory list.
    expect(() => saveAttempt(record, blocked)).not.toThrow();
    expect(saveAttempt(record, blocked)).toEqual([record]);
  });
});
