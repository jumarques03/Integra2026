import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  ano: null,
  equipe: null,
  startedAt: null,
  finishedAt: null,
  messages: [],

  setAno: (ano) => set({ ano }),

  setEquipe: (equipe) =>
    set({ equipe, startedAt: Date.now(), finishedAt: null, messages: [] }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  finish: () => set({ finishedAt: Date.now() }),

  getElapsedMinutes: () => {
    const { startedAt, finishedAt } = get();
    if (!startedAt) return 0;
    const end = finishedAt ?? Date.now();
    return Math.max(1, Math.round((end - startedAt) / 60000));
  },

  reset: () =>
    set({
      ano: null,
      equipe: null,
      startedAt: null,
      finishedAt: null,
      messages: [],
    }),
}));
