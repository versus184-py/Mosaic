import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "../canvasStore";
import { useCanvasManagerStore } from "../canvasManagerStore";

const makeNode = (id: string, type = "root") => ({
  id,
  type: "messageNode",
  position: { x: 0, y: 0 },
  data: {
    id,
    label: `Node ${id}`,
    messages: [],
    isActive: true,
    isTyping: false,
    nodeType: type as "root" | "branch" | "response",
  },
});

const makeEdge = (id: string, source: string, target: string) => ({
  id,
  source,
  target,
});

describe("canvasStore", () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      activeNodeId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      positionHistory: [],
      bookmarkedIds: new Set(),
    });
  });

  describe("addNode / removeNode", () => {
    it("adds a node and records history", () => {
      const node = makeNode("n1");
      useCanvasStore.getState().addNode(node);
      expect(useCanvasStore.getState().nodes).toHaveLength(1);
      expect(useCanvasStore.getState().positionHistory).toHaveLength(1);
    });

    it("removes a node and its edges", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().addNode(makeNode("n2"));
      useCanvasStore.getState().addEdge(makeEdge("e1", "n1", "n2"));
      useCanvasStore.getState().removeNode("n1");
      expect(useCanvasStore.getState().nodes).toHaveLength(1);
      expect(useCanvasStore.getState().edges).toHaveLength(0);
    });
  });

  describe("removeCascade", () => {
    it("removes a node and all descendants", () => {
      useCanvasStore.getState().addNode(makeNode("root"));
      useCanvasStore.getState().addNode(makeNode("child1"));
      useCanvasStore.getState().addNode(makeNode("grandchild1"));
      useCanvasStore.getState().addEdge(makeEdge("e1", "root", "child1"));
      useCanvasStore.getState().addEdge(makeEdge("e2", "child1", "grandchild1"));
      useCanvasStore.getState().removeCascade("child1");
      const ids = useCanvasStore.getState().nodes.map((n) => n.id);
      expect(ids).toContain("root");
      expect(ids).not.toContain("child1");
      expect(ids).not.toContain("grandchild1");
    });

    it("clears activeNodeId if cascade removes it", () => {
      useCanvasStore.getState().addNode(makeNode("root"));
      useCanvasStore.getState().addNode(makeNode("target"));
      useCanvasStore.getState().addEdge(makeEdge("e1", "root", "target"));
      useCanvasStore.getState().setActiveNode("target");
      useCanvasStore.getState().removeCascade("target");
      expect(useCanvasStore.getState().activeNodeId).toBeNull();
    });

    it("preserves activeNodeId if cascade does not include it", () => {
      useCanvasStore.getState().addNode(makeNode("root"));
      useCanvasStore.getState().addNode(makeNode("other"));
      useCanvasStore.getState().addEdge(makeEdge("e1", "root", "other"));
      useCanvasStore.getState().setActiveNode("other");
      useCanvasStore.getState().removeCascade("root");
      expect(useCanvasStore.getState().activeNodeId).toBeNull();
    });
  });

  describe("undo", () => {
    it("restores previous state", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().addNode(makeNode("n2"));
      expect(useCanvasStore.getState().nodes).toHaveLength(2);
      useCanvasStore.getState().undo();
      expect(useCanvasStore.getState().nodes).toHaveLength(1);
    });

    it("canUndo returns false when history is empty", () => {
      expect(useCanvasStore.getState().canUndo()).toBe(false);
    });

    it("canUndo returns true after an operation", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      expect(useCanvasStore.getState().canUndo()).toBe(true);
    });

    it("does nothing when history is empty", () => {
      const before = useCanvasStore.getState().nodes.length;
      useCanvasStore.getState().undo();
      expect(useCanvasStore.getState().nodes.length).toBe(before);
    });

    it("limits history to 50 entries", () => {
      for (let i = 0; i < 60; i++) {
        useCanvasStore.getState().addNode(makeNode(`n${i}`));
      }
      expect(useCanvasStore.getState().positionHistory.length).toBeLessThanOrEqual(50);
    });
  });

  describe("updateNode", () => {
    it("updates node data fields", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().updateNode("n1", { label: "Updated" });
      expect(useCanvasStore.getState().nodes[0].data.label).toBe("Updated");
    });

    it("tracks bookmarkedIds when bookmark toggled", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().updateNode("n1", { bookmarked: true });
      expect(useCanvasStore.getState().bookmarkedIds.has("n1")).toBe(true);
      useCanvasStore.getState().updateNode("n1", { bookmarked: false });
      expect(useCanvasStore.getState().bookmarkedIds.has("n1")).toBe(false);
    });
  });

  describe("toggleBookmark", () => {
    it("toggles bookmark state", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().toggleBookmark("n1");
      expect(useCanvasStore.getState().nodes[0].data.bookmarked).toBe(true);
      expect(useCanvasStore.getState().bookmarkedIds.has("n1")).toBe(true);
      useCanvasStore.getState().toggleBookmark("n1");
      expect(useCanvasStore.getState().nodes[0].data.bookmarked).toBe(false);
      expect(useCanvasStore.getState().bookmarkedIds.has("n1")).toBe(false);
    });
  });

  describe("toggleCollapse", () => {
    it("toggles collapsed state", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      expect(useCanvasStore.getState().nodes[0].data.collapsed).toBeUndefined();
      useCanvasStore.getState().toggleCollapse("n1");
      expect(useCanvasStore.getState().nodes[0].data.collapsed).toBe(true);
      useCanvasStore.getState().toggleCollapse("n1");
      expect(useCanvasStore.getState().nodes[0].data.collapsed).toBe(false);
    });
  });

  describe("getDescendantIds", () => {
    it("returns all descendants recursively", () => {
      useCanvasStore.getState().addNode(makeNode("root"));
      useCanvasStore.getState().addNode(makeNode("a"));
      useCanvasStore.getState().addNode(makeNode("b"));
      useCanvasStore.getState().addNode(makeNode("c"));
      useCanvasStore.getState().addEdge(makeEdge("e1", "root", "a"));
      useCanvasStore.getState().addEdge(makeEdge("e2", "a", "b"));
      useCanvasStore.getState().addEdge(makeEdge("e3", "b", "c"));
      const descendants = useCanvasStore.getState().getDescendantIds("root");
      expect(descendants).toEqual(["a", "b", "c"]);
    });

    it("returns empty for leaf node", () => {
      useCanvasStore.getState().addNode(makeNode("leaf"));
      expect(useCanvasStore.getState().getDescendantIds("leaf")).toEqual([]);
    });
  });

  describe("getConversationPath", () => {
    it("walks up tree and collects messages", () => {
      useCanvasStore.getState().addNode({
        id: "root",
        type: "messageNode",
        position: { x: 0, y: 0 },
        data: { id: "root", label: "Root", messages: [{ id: "m1", role: "user", content: "hello", timestamp: 1 }], isActive: true, isTyping: false, nodeType: "root" },
      });
      useCanvasStore.getState().addNode({
        id: "reply",
        type: "messageNode",
        position: { x: 200, y: 0 },
        data: { id: "reply", label: "Reply", messages: [{ id: "m2", role: "assistant", content: "hi there", timestamp: 2 }], isActive: true, isTyping: false, nodeType: "response" },
      });
      useCanvasStore.getState().addEdge(makeEdge("e1", "root", "reply"));
      const path = useCanvasStore.getState().getConversationPath("reply");
      expect(path).toHaveLength(2);
      expect(path[0].role).toBe("user");
      expect(path[0].content).toBe("hello");
      expect(path[1].role).toBe("assistant");
      expect(path[1].content).toBe("hi there");
    });

    it("returns only root message for root node", () => {
      useCanvasStore.getState().addNode({
        id: "root",
        type: "messageNode",
        position: { x: 0, y: 0 },
        data: { id: "root", label: "Root", messages: [{ id: "m1", role: "user", content: "hi", timestamp: 1 }], isActive: true, isTyping: false, nodeType: "root" },
      });
      const path = useCanvasStore.getState().getConversationPath("root");
      expect(path).toHaveLength(1);
    });

    it("returns empty for non-existent node", () => {
      const path = useCanvasStore.getState().getConversationPath("nonexistent");
      expect(path).toEqual([]);
    });
  });

  describe("clearCanvas", () => {
    it("clears all nodes, edges, and active node", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().addNode(makeNode("n2"));
      useCanvasStore.getState().setActiveNode("n1");
      useCanvasStore.getState().clearCanvas();
      expect(useCanvasStore.getState().nodes).toHaveLength(0);
      expect(useCanvasStore.getState().edges).toHaveLength(0);
      expect(useCanvasStore.getState().activeNodeId).toBeNull();
      expect(useCanvasStore.getState().bookmarkedIds.size).toBe(0);
    });
  });

  describe("importData", () => {
    it("replaces entire canvas state", () => {
      useCanvasStore.getState().addNode(makeNode("old"));
      useCanvasStore.getState().importData({
        nodes: [makeNode("new1"), makeNode("new2")],
        edges: [makeEdge("e1", "new1", "new2")],
      });
      expect(useCanvasStore.getState().nodes).toHaveLength(2);
      expect(useCanvasStore.getState().edges).toHaveLength(1);
      expect(useCanvasStore.getState().positionHistory).toHaveLength(0);
    });
  });

  describe("autoLayout", () => {
    it("applies positions to nodes", () => {
      useCanvasStore.getState().addNode(makeNode("root"));
      useCanvasStore.getState().addNode(makeNode("child"));
      useCanvasStore.getState().addEdge(makeEdge("e1", "root", "child"));
      useCanvasStore.getState().autoLayout();
      const child = useCanvasStore.getState().nodes.find((n) => n.id === "child");
      expect(child?.position.x).not.toBe(0);
      expect(child?.position.y).not.toBe(0);
    });
  });

  describe("updateNodePosition", () => {
    it("updates position and records history on change", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().updateNodePosition("n1", { x: 100, y: 200 });
      expect(useCanvasStore.getState().nodes[0].position).toEqual({ x: 100, y: 200 });
      expect(useCanvasStore.getState().positionHistory.length).toBeGreaterThan(0);
    });

    it("does not record history when position unchanged", () => {
      useCanvasStore.getState().addNode(makeNode("n1"));
      useCanvasStore.getState().updateNodePosition("n1", { x: 0, y: 0 });
      expect(useCanvasStore.getState().positionHistory.length).toBe(1);
    });
  });

  describe("setViewport", () => {
    it("sets viewport", () => {
      const vp = { x: 100, y: 200, zoom: 1.5 };
      useCanvasStore.getState().setViewport(vp);
      expect(useCanvasStore.getState().viewport).toEqual(vp);
    });
  });
});
