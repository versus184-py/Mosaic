import { create } from "zustand";

interface PruneState {
  pruneActive: boolean;
  pruneGoal: string;
  isPruning: boolean;
  setPruneActive: (v: boolean) => void;
  setPruneGoal: (g: string) => void;
  setIsPruning: (v: boolean) => void;
  clearPrune: () => void;
}

export const usePruneStore = create<PruneState>((set) => ({
  pruneActive: false,
  pruneGoal: "",
  isPruning: false,
  setPruneActive: (v) => set({ pruneActive: v }),
  setPruneGoal: (g) => set({ pruneGoal: g }),
  setIsPruning: (v) => set({ isPruning: v }),
  clearPrune: () => set({ pruneActive: false, pruneGoal: "" }),
}));
