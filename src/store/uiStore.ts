import { create } from "zustand";

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
  apiKey: string;
}

function loadUI(): Partial<UIPersisted> {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
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
  apiKey: string;
  showBookmarksOnly: boolean;

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
  setApiKey: (k: string) => void;
  setShowBookmarksOnly: (s: boolean) => void;

  getSelectedModel: () => ModelOption | undefined;
  getAvailableModels: () => ModelOption[];
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
  apiKey: persisted.apiKey || "",
  showBookmarksOnly: false,

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

  setApiKey: (k) => {
    set({ apiKey: k });
    saveUI({ ...get(), apiKey: k });
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

  getSelectedModel: () => AVAILABLE_MODELS.find((m) => m.id === get().model),

  getAvailableModels: () => AVAILABLE_MODELS,
}));

applyTheme(useUIStore.getState().theme);
