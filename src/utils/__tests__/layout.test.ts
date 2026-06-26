import { describe, it, expect } from "vitest";
import { generateId, deepClone, calculateRadialPosition, layoutTree } from "../layout";

describe("generateId", () => {
  it("generates UUID-like strings", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f-]+$/);
    expect(id.length).toBe(36);
  });

  it("generates 100 unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("deepClone", () => {
  it("clones a plain object", () => {
    const obj = { a: 1, b: { c: 2 } };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
    expect(clone.b).not.toBe(obj.b);
  });

  it("clones an array", () => {
    const arr = [{ x: 1 }, { x: 2 }];
    const clone = deepClone(arr);
    expect(clone).toEqual(arr);
    expect(clone).not.toBe(arr);
    expect(clone[0]).not.toBe(arr[0]);
  });

  it("handles null", () => {
    expect(deepClone(null)).toBeNull();
  });

  it("handles primitive values", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
  });
});

describe("calculateRadialPosition", () => {
  it("positions first child above parent (angle -PI/2)", () => {
    const pos = calculateRadialPosition({ x: 0, y: 0 }, 0, 4, 1);
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeLessThan(0);
    expect(Math.abs(pos.y)).toBeCloseTo(280, -1);
  });

  it("spreads children evenly around parent", () => {
    const positions = [0, 1, 2, 3].map((i) =>
      calculateRadialPosition({ x: 0, y: 0 }, i, 4, 1)
    );
    // All should be at same distance
    const distances = positions.map((p) => Math.sqrt(p.x ** 2 + p.y ** 2));
    distances.forEach((d) => expect(d).toBeCloseTo(280, -1));
  });

  it("increases distance with depth", () => {
    const d1 = calculateRadialPosition({ x: 0, y: 0 }, 0, 1, 1);
    const d2 = calculateRadialPosition({ x: 0, y: 0 }, 0, 1, 2);
    const dist1 = Math.sqrt(d1.x ** 2 + d1.y ** 2);
    const dist2 = Math.sqrt(d2.x ** 2 + d2.y ** 2);
    expect(dist2).toBeGreaterThan(dist1);
  });

  it("handles single child", () => {
    const pos = calculateRadialPosition({ x: 100, y: 100 }, 0, 1, 0);
    expect(pos.x).toBeCloseTo(100);
  });
});

describe("layoutTree", () => {
  it("returns positions for a simple tree", () => {
    const nodes = [
      { id: "root", position: { x: 0, y: 0 } },
      { id: "child", position: { x: 0, y: 0 } },
    ];
    const edges = [{ source: "root", target: "child" }];
    const positions = layoutTree(nodes, edges);
    expect(positions.size).toBe(2);
    expect(positions.get("root")).toEqual({ x: 0, y: 0 });
    expect(positions.get("child")).toBeDefined();
  });

  it("returns empty for no nodes", () => {
    const positions = layoutTree([], []);
    expect(positions.size).toBe(0);
  });

  it("handles disconnected nodes", () => {
    const nodes = [
      { id: "a", position: { x: 0, y: 0 } },
      { id: "b", position: { x: 0, y: 0 } },
    ];
    const positions = layoutTree(nodes, []);
    expect(positions.size).toBe(1); // only the implicit root
  });

  it("handles single node", () => {
    const nodes = [{ id: "root", position: { x: 0, y: 0 } }];
    const positions = layoutTree(nodes, []);
    expect(positions.size).toBe(1);
    expect(positions.get("root")).toEqual({ x: 0, y: 0 });
  });

  it("handles deep chain", () => {
    const nodes = [
      { id: "a", position: { x: 0, y: 0 } },
      { id: "b", position: { x: 0, y: 0 } },
      { id: "c", position: { x: 0, y: 0 } },
    ];
    const edges = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ];
    const positions = layoutTree(nodes, edges);
    expect(positions.size).toBe(3);
    const posC = positions.get("c")!;
    const posB = positions.get("b")!;
    const distC = Math.sqrt(posC.x ** 2 + posC.y ** 2);
    const distB = Math.sqrt(posB.x ** 2 + posB.y ** 2);
    expect(distC).toBeGreaterThan(distB);
  });
});
