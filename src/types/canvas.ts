export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface NodeData {
  id: string;
  label: string;
  messages: Message[];
  isActive: boolean;
  isTyping: boolean;
  nodeType: "root" | "branch" | "response" | "suggestion" | "distillation";
  collapsed?: boolean;
  bookmarked?: boolean;
  width?: number;
  height?: number;
  execOutputs?: Record<string, { output: string; result: string }>;
  confidence?: number;
  suggestionText?: string;
  modelLabel?: string;
  debateModel?: string;
  pruneScore?: number;
  pruned?: boolean;
  [key: string]: unknown;
}

export interface ChatNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface ChatEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface CanvasState {
  nodes: ChatNode[];
  edges: ChatEdge[];
  activeNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  positionHistory: { nodes: ChatNode[]; edges: ChatEdge[] }[];
}

export interface ProviderConfig {
  url: string;
  label: string;
}
