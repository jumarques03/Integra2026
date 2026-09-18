import { useEffect, useRef, useState } from "react";

const LIMITE_SEGUNDOS = 10;

function estaAusente() {
  return document.hidden || !document.hasFocus();
}

export function useTabGuard({ enabled, onDisqualify }) {
  const [ausente, setAusente] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(LIMITE_SEGUNDOS);
  const intervalRef = useRef(null);
  const saiuEmRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const limparContagem = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const iniciarContagem = () => {
      saiuEmRef.current = Date.now();
      setSegundosRestantes(LIMITE_SEGUNDOS);
      limparContagem();
      intervalRef.current = setInterval(() => {
        const passado = Math.floor((Date.now() - saiuEmRef.current) / 1000);
        const restante = Math.max(0, LIMITE_SEGUNDOS - passado);
        setSegundosRestantes(restante);
        if (restante <= 0) {
          limparContagem();
          onDisqualify();
        }
      }, 250);
    };

    const verificar = () => {
      if (estaAusente()) {
        setAusente(true);
        if (!intervalRef.current) iniciarContagem();
      } else {
        setAusente(false);
        limparContagem();
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    document.addEventListener("visibilitychange", verificar);
    window.addEventListener("blur", verificar);
    window.addEventListener("focus", verificar);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", verificar);
      window.removeEventListener("blur", verificar);
      window.removeEventListener("focus", verificar);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      limparContagem();
    };
  }, [enabled, onDisqualify]);

  return { ausente, segundosRestantes, limite: LIMITE_SEGUNDOS };
}
