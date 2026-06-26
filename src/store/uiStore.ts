import { create } from "zustand";
import { hasApiKey } from "../api/config";

export type ThemeName = "void" | "dusk" | "sand" | "snow" | "sunrise";

export interface ModelOption {
  id: string;
  label: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  { id: "mistral-large-latest", label: "Mistral Large" },
  { id: "mistral-small-latest", label: "Mistral Small" },
];

const UI_KEY = "mosaic-ui";

interface UIPersisted {
  theme: ThemeName;
  showMiniMap: boolean;
  systemPrompt: string;
  temperature: number;
  model: string;
  confidenceEnabled: boolean;
  tendrilsEnabled: boolean;
  debateModels: string[];
}

function loadUI(): Partial<UIPersisted> {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
    return {};
  } catch (error) {
    console.warn("Failed to load UI state from localStorage:", error);
    return {};
  }
}

function saveUI(state: UIPersisted) {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save UI state to localStorage:", error);
  }
}

const persisted = loadUI();

interface UIState {
  theme: ThemeName;
  zoom: number;
  showMiniMap: boolean;
  showWelcome: boolean;
  settingsOpen: boolean;
  systemPrompt: string;
  temperature: number;
  model: string;
  searchQuery: string;
  searchOpen: boolean;
  showBookmarksOnly: boolean;
  confidenceEnabled: boolean;
  tendrilsEnabled: boolean;
  debateModels: string[];

  setTheme: (t: ThemeName) => void;
  setZoom: (z: number) => void;
  toggleMiniMap: () => void;
  setShowWelcome: (s: boolean) => void;
  setSettingsOpen: (s: boolean) => void;
  toggleSettings: () => void;
  setSystemPrompt: (p: string) => void;
  setTemperature: (t: number) => void;
  setModel: (m: string) => void;
  setSearchQuery: (q: string) => void;
  setSearchOpen: (o: boolean) => void;
  setShowBookmarksOnly: (s: boolean) => void;
  setConfidenceEnabled: (v: boolean) => void;
  setTendrilsEnabled: (v: boolean) => void;
  setDebateModels: (m: string[]) => void;

  getSelectedModel: () => ModelOption | undefined;
  getAvailableModels: () => ModelOption[];
  hasApiKey: () => boolean;
}

function applyTheme(theme: ThemeName) {
  document.documentElement.className = document.documentElement.className
    .split(" ")
    .filter((c) => !c.startsWith("theme-"))
    .join(" ");
  document.documentElement.classList.add(`theme-${theme}`);
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: persisted.theme || "sunrise",
  zoom: 1,
  showMiniMap: persisted.showMiniMap || false,
  showWelcome: true,
  settingsOpen: false,
  systemPrompt: persisted.systemPrompt || "You are a helpful AI assistant. Be concise and clear.",
  temperature: persisted.temperature ?? 0.7,
  model: (persisted.model && AVAILABLE_MODELS.some((m) => m.id === persisted.model))
    ? persisted.model
    : "mistral-large-latest",
  searchQuery: "",
  searchOpen: false,
  showBookmarksOnly: false,
  confidenceEnabled: persisted.confidenceEnabled ?? true,
  tendrilsEnabled: persisted.tendrilsEnabled ?? true,
  debateModels: persisted.debateModels ?? ["mistral-large-latest"],

  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
    saveUI({ ...get(), theme: t });
  },

  setZoom: (z) => set({ zoom: z }),

  toggleMiniMap: () => {
    const next = !get().showMiniMap;
    set({ showMiniMap: next });
    saveUI({ ...get(), showMiniMap: next });
  },

  setShowWelcome: (s) => set({ showWelcome: s }),
  setSettingsOpen: (s) => set({ settingsOpen: s }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  setSystemPrompt: (p) => {
    set({ systemPrompt: p });
    saveUI({ ...get(), systemPrompt: p });
  },

  setTemperature: (t) => {
    set({ temperature: t });
    saveUI({ ...get(), temperature: t });
  },

  setModel: (m) => {
    set({ model: m });
    saveUI({ ...get(), model: m });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchOpen: (o) => set({ searchOpen: o }),
  setShowBookmarksOnly: (s) => set({ showBookmarksOnly: s }),
  setConfidenceEnabled: (v) => { set({ confidenceEnabled: v }); saveUI({ ...get(), confidenceEnabled: v }); },
  setTendrilsEnabled: (v) => { set({ tendrilsEnabled: v }); saveUI({ ...get(), tendrilsEnabled: v }); },
  setDebateModels: (m) => { set({ debateModels: m }); saveUI({ ...get(), debateModels: m }); },

  getSelectedModel: () => AVAILABLE_MODELS.find((m) => m.id === get().model),

  getAvailableModels: () => AVAILABLE_MODELS,

  hasApiKey: () => hasApiKey(),
}));

applyTheme(useUIStore.getState().theme);
