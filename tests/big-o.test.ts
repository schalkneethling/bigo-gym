import { describe, expect, it } from "vitest";
import { COMPLEXITY_CLASSES } from "../src/catalogue";
import { COMPLEXITY_PROFILES } from "../src/content/big-o";

describe("Big-O primer content integrity", () => {
  it("profiles every complexity class from the answer set, in order", () => {
    expect(COMPLEXITY_PROFILES.map((p) => p.complexity)).toEqual([...COMPLEXITY_CLASSES]);
  });

  it("gives every class a spoken name, a growth line, a concrete anchor, and a where-you-meet-it", () => {
    for (const profile of COMPLEXITY_PROFILES) {
      expect(profile.name.trim().length, profile.complexity).toBeGreaterThan(0);
      expect(profile.growth.trim().length, profile.complexity).toBeGreaterThan(0);
      expect(profile.atScale.trim().length, profile.complexity).toBeGreaterThan(0);
      expect(profile.spotIt.trim().length, profile.complexity).toBeGreaterThan(0);
    }
  });

  it("names the classes engineers say out loud", () => {
    const byClass = new Map(COMPLEXITY_PROFILES.map((p) => [p.complexity, p.name]));
    expect(byClass.get("O(n)")).toContain("linear");
    expect(byClass.get("O(n²)")).toContain("quadratic");
    expect(byClass.get("O(1)")).toContain("constant");
    expect(byClass.get("O(2^n)")).toContain("exponential");
  });
});
