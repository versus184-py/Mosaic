import { useCallback, useEffect, useState } from "react";
import { TopBar } from "./components/ui/TopBar";
import { ZoomControls } from "./components/ui/ZoomControls";
import { WelcomeScreen } from "./components/ui/WelcomeScreen";
import { SettingsDrawer } from "./components/ui/SettingsDrawer";
import { ToastContainer } from "./components/ui/ToastContainer";
import { MosaicCanvas } from "./components/canvas/MosaicCanvas";
import { OnboardingHint } from "./components/ui/OnboardingHint";
import { SearchOverlay } from "./components/ui/SearchOverlay";
import { ShortcutsModal } from "./components/ui/ShortcutsModal";
import { PythonTerminal } from "./components/ui/PythonTerminal";
import { CanvasTabs } from "./components/ui/CanvasTabs";
import { PruneBanner } from "./components/ui/PruneBanner";
import { useCanvasStore } from "./store/canvasStore";
import { useCanvasManagerStore } from "./store/canvasManagerStore";
import { useUIStore } from "./store/uiStore";
import { useOllamaDetect } from "./hooks/useOllamaDetect";
import { generateId } from "./utils/layout";

export default function App() {
  const addNode = useCanvasStore((s) => s.addNode);
  const setActiveNode = useCanvasStore((s) => s.setActiveNode);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const undo = useCanvasStore((s) => s.undo);
  const removeCascade = useCanvasStore((s) => s.removeCascade);
  const nodesLen = useCanvasStore((s) => s.nodes.length);
  const activeNodeId = useCanvasStore((s) => s.activeNodeId);
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useOllamaDetect();

  const handleNewChat = useCallback(() => {
    clearCanvas();
    const rootId = generateId();
    addNode({
      id: rootId,
      type: "messageNode",
      position: { x: 0, y: 0 },
      data: {
        id: rootId,
        label: "Start a new thread",
        messages: [],
        isActive: true,
        isTyping: false,
        nodeType: "root",
      },
    });
    setActiveNode(rootId);
  }, [addNode, setActiveNode, clearCanvas]);

  const hasNodes = nodesLen > 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      if (e.key === "Escape" && activeNodeId) {
        setActiveNode(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !isInput) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !isInput) {
        e.preventDefault();
        handleNewChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && !isInput) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && activeNodeId && !isInput) {
        const node = useCanvasStore.getState().nodes.find((n) => n.id === activeNodeId);
        if (node && node.data.nodeType !== "root") {
          e.preventDefault();
          removeCascade(activeNodeId);
        }
      }
      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeNodeId, setActiveNode, undo, handleNewChat, removeCascade]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <TopBar onNewChat={handleNewChat} />
      <CanvasTabs />
      <MosaicCanvas />

      {!hasNodes && <WelcomeScreen onStart={handleNewChat} />}

      <ZoomControls zoom={zoom} onZoomChange={setZoom} />
      <SettingsDrawer />
      <SearchOverlay />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <PruneBanner />
      <ToastContainer />
      <OnboardingHint />
      <PythonTerminal />
    </div>
  );
}
