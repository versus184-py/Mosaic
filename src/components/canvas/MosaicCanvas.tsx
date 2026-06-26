import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "../../store/canvasStore";
import { useUIStore } from "../../store/uiStore";
import MessageNode from "./MessageNode";
import { LiquidEdge } from "./LiquidEdge";
import { TendrilEdge } from "./TendrilEdge";
import { DistillEdge } from "./DistillEdge";
import { DragLens } from "../glass/DragLens";

const nodeTypes = { messageNode: MessageNode };
const edgeTypes = { liquidEdge: LiquidEdge, tendrilEdge: TendrilEdge, distillEdge: DistillEdge };

const LIGHT_THEMES = new Set(["sand", "snow", "sunrise"]);

function FlowInner() {
  const storeNodes = useCanvasStore((s) => s.nodes);
  const storeEdges = useCanvasStore((s) => s.edges);
  const storeViewport = useCanvasStore((s) => s.viewport);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const setActiveNode = useCanvasStore((s) => s.setActiveNode);
  const updateNodePosition = useCanvasStore((s) => s.updateNodePosition);
  const getDescendantIds = useCanvasStore((s) => s.getDescendantIds);
  const theme = useUIStore((s) => s.theme);
  const showMiniMap = useUIStore((s) => s.showMiniMap);
  const setZoom = useUIStore((s) => s.setZoom);
  const zoom = useUIStore((s) => s.zoom);
  const showBookmarksOnly = useUIStore((s) => s.showBookmarksOnly);
  const bookmarkedIds = useCanvasStore((s) => s.bookmarkedIds);

  const rf = useReactFlow();
  const restoring = useRef(true);
  const isLight = LIGHT_THEMES.has(theme);

  const hiddenIds = useMemo(() => {
    const collapsed = storeNodes.filter((n) => n.data.collapsed);
    const ids = new Set<string>();
    for (const node of collapsed) {
      const descendants = getDescendantIds(node.id);
      for (const d of descendants) ids.add(d);
    }
    return ids;
  }, [storeNodes, getDescendantIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const visibleStoreNodes = useMemo(() => {
    let filtered = storeNodes;
    if (showBookmarksOnly) {
      filtered = filtered.filter((n) => bookmarkedIds.has(n.id));
    }
    return filtered.filter((n) => !hiddenIds.has(n.id));
  }, [storeNodes, hiddenIds, showBookmarksOnly, bookmarkedIds]);

  const visibleNodeIdSet = useMemo(
    () => new Set(visibleStoreNodes.map((n) => n.id)),
    [visibleStoreNodes]
  );

  const visibleStoreEdges = useMemo(() => {
    return storeEdges.filter(
      (e) => visibleNodeIdSet.has(e.source) && visibleNodeIdSet.has(e.target) &&
        !hiddenIds.has(e.source) && !hiddenIds.has(e.target)
    );
  }, [storeEdges, hiddenIds, visibleNodeIdSet]);

  useEffect(() => {
    restoring.current = false;
    setNodes(
      visibleStoreNodes.map((n) => ({
        id: n.id,
        type: "messageNode",
        position: n.position,
        data: n.data,
      }))
    );
  }, [visibleStoreNodes, setNodes]);

  useEffect(() => {
    setEdges(
      visibleStoreEdges.map((e) => {
        const tgtNode = storeNodes.find((n) => n.id === e.target);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type || "liquidEdge",
          data: { pruned: tgtNode?.data?.pruned ?? false },
        };
      })
    );
  }, [visibleStoreEdges, storeNodes, setEdges]);

  useEffect(() => {
    const vp = rf.getViewport();
    if (Math.abs(vp.zoom - zoom) > 0.005 || Math.abs(vp.x - storeViewport.x) > 1 || Math.abs(vp.y - storeViewport.y) > 1) {
      rf.setViewport({ x: storeViewport.x, y: storeViewport.y, zoom }, { duration: 0 });
    }
  }, [zoom, storeViewport, rf]);

  // Zoom keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      if (isInput) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        rf.zoomIn({ duration: 200 });
      } else if (e.key === "-") {
        e.preventDefault();
        rf.zoomOut({ duration: 200 });
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        rf.fitView({ duration: 200, padding: 0.15 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [rf]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (restoring.current) return;
      for (const change of changes) {
        if (change.type === "position" && change.dragging === false && change.position) {
          updateNodePosition(change.id, change.position);
        }
      }
    },
    [onNodesChange, updateNodePosition]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      addEdge({
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: "liquidEdge",
      });
    },
    [addEdge]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setActiveNode(node.id);
    },
    [setActiveNode]
  );

  const handleViewportChange = useCallback(
    (vp: { x: number; y: number; zoom: number }) => {
      setZoom(vp.zoom);
      useCanvasStore.getState().setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
    },
    [setZoom]
  );

  const defaultViewport = useMemo(
    () => ({ x: window.innerWidth / 2 - 130, y: window.innerHeight / 2 - 35, zoom: 1 }),
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onViewportChange={handleViewportChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultViewport={defaultViewport}
      minZoom={0.05}
      maxZoom={3}
      zoomOnScroll
      panOnDrag
      fitView={false}
      style={{ background: "transparent" }}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        color={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"}
        gap={40}
      />
      {showMiniMap && (
        <MiniMap
          style={{
            background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
            backdropFilter: "blur(8px)",
            border: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            overflow: "hidden",
          }}
          nodeColor={() => (isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)")}
          maskColor={isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.3)"}
        />
      )}
    </ReactFlow>
  );
}

export function MosaicCanvas() {
  return (
    <div style={{ flex: 1, position: "relative", borderRadius: 28, overflow: "hidden" }}>
      <ReactFlowProvider>
        <FlowInner />
      </ReactFlowProvider>
      <DragLens initialX={40} initialY={40} />
    </div>
  );
}
