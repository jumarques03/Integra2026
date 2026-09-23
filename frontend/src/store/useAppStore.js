import { create } from "zustand";
import { persist } from "zustand/middleware";

function newSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      ano: null,
      equipe: null,
      sessionId: null,
      startedAt: null,
      finishedAt: null,
      messages: [],
      desclassificado: false,
      enigmaConcluido: false,

      setAno: (ano) => set({ ano }),

      setEquipe: (equipe) =>
        set({
          equipe,
          sessionId: newSessionId(),
          startedAt: null,
          finishedAt: null,
          messages: [],
          desclassificado: false,
          enigmaConcluido: false,
        }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      // Atualiza o texto de uma mensagem existente pelo id (usado pra ir
      // "encaixando" os pedaços do streaming na bolha certa).
      updateMessageText: (id, updater) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id
              ? {
                  ...m,
                  text:
                    typeof updater === "function" ? updater(m.text) : updater,
                }
              : m,
          ),
        })),

      // O relógio só começa quando o primeiro enigma aparece na tela (primeira
      // resposta da IA), e só uma vez por partida.
      iniciarCronometro: () =>
        set((state) => (state.startedAt ? state : { startedAt: Date.now() })),

      finish: () => set({ finishedAt: Date.now() }),

      // A IA já sinalizou que os enigmas acabaram, mas a navegação para a
      // tela de resultado só acontece quando o aluno confirma clicando no
      // botão "Concluir enigma" (ver Chat.jsx).
      marcarEnigmaConcluido: () => set({ enigmaConcluido: true }),

      desclassificar: () => set({ desclassificado: true }),

      getElapsedMs: () => {
        const { startedAt, finishedAt } = get();
        if (!startedAt) return 0;
        const end = finishedAt ?? Date.now();
        return Math.max(0, end - startedAt);
      },

      reset: () =>
        set({
          ano: null,
          equipe: null,
          sessionId: null,
          startedAt: null,
          finishedAt: null,
          messages: [],
          desclassificado: false,
          enigmaConcluido: false,
        }),
    }),
    {
      name: "ai-mistery-storage",
      // Mudou a lista de anos (o "4º ao 5º ano" virou dois cards): um estado
      // salvo antes disso pode apontar para uma turma que não existe mais,
      // então descarta a partida antiga em vez de quebrar o chat.
      version: 1,
      migrate: () => ({
        ano: null,
        equipe: null,
        sessionId: null,
        startedAt: null,
        finishedAt: null,
        messages: [],
        desclassificado: false,
        enigmaConcluido: false,
      }),
    },
  ),
);
