import { useCallback, useEffect, useRef, useState } from "react";

const LIMITE_SEGUNDOS = 10;
const INTERVALO_VERIFICACAO_MS = 400;

function estaAusente() {
  return document.hidden || !document.hasFocus();
}

// Fases do aviso de "saiu da aba":
// - "present": tudo normal, nada visível.
// - "away": a pessoa está fora agora, contagem regressiva rodando.
// - "return-pending": a pessoa já voltou, mas o aviso continua na tela
//   até ela clicar no botão de confirmar — não some sozinho.
export function useTabGuard({ enabled, onDisqualify }) {
  const [phase, setPhase] = useState("present");
  const [segundosRestantes, setSegundosRestantes] = useState(LIMITE_SEGUNDOS);
  const saiuEmRef = useRef(null);
  const disparadoRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    saiuEmRef.current = null;
    disparadoRef.current = false;
    setPhase("present");
    setSegundosRestantes(LIMITE_SEGUNDOS);

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Verificação por polling (em vez de depender só de eventos como
    // visibilitychange/blur): mais confiável entre navegadores, já que
    // consulta o estado real da aba a cada tick em vez de esperar um
    // evento que nem sempre dispara de forma consistente.
    const poll = setInterval(() => {
      if (disparadoRef.current) return;

      if (estaAusente()) {
        if (!saiuEmRef.current) saiuEmRef.current = Date.now();
        const passado = Math.floor((Date.now() - saiuEmRef.current) / 1000);
        const restante = Math.max(0, LIMITE_SEGUNDOS - passado);
        setSegundosRestantes(restante);
        setPhase((p) => (p === "away" ? p : "away"));
        if (restante <= 0) {
          disparadoRef.current = true;
          onDisqualify();
        }
      } else {
        saiuEmRef.current = null;
        setSegundosRestantes(LIMITE_SEGUNDOS);
        // A pessoa voltou, mas o aviso só sai da tela quando ela
        // confirmar clicando no botão (confirmarVolta).
        setPhase((p) => (p === "away" ? "return-pending" : p));
      }
    }, INTERVALO_VERIFICACAO_MS);

    return () => {
      clearInterval(poll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, onDisqualify]);

  const confirmarVolta = useCallback(() => {
    setPhase((p) => (p === "return-pending" ? "present" : p));
  }, []);

  return {
    avisoAtivo: phase !== "present",
    aguardandoConfirmacao: phase === "return-pending",
    segundosRestantes,
    confirmarVolta,
    limite: LIMITE_SEGUNDOS,
  };
}
