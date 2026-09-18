import { useEffect, useRef, useState } from "react";

const LIMITE_SEGUNDOS = 10;
const INTERVALO_VERIFICACAO_MS = 400;

function estaAusente() {
  return document.hidden || !document.hasFocus();
}

export function useTabGuard({ enabled, onDisqualify }) {
  const [ausente, setAusente] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(LIMITE_SEGUNDOS);
  const saiuEmRef = useRef(null);
  const disparadoRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    saiuEmRef.current = null;
    disparadoRef.current = false;
    setAusente(false);
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
        setAusente(true);
        setSegundosRestantes(restante);
        if (restante <= 0) {
          disparadoRef.current = true;
          onDisqualify();
        }
      } else {
        saiuEmRef.current = null;
        setAusente(false);
        setSegundosRestantes(LIMITE_SEGUNDOS);
      }
    }, INTERVALO_VERIFICACAO_MS);

    return () => {
      clearInterval(poll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, onDisqualify]);

  return { ausente, segundosRestantes, limite: LIMITE_SEGUNDOS };
}
