import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { formatarTempo } from "../utils/tempo";

// Isolado num componente próprio para que só ele re-renderize a cada tick
// (e não a lista inteira de mensagens do chat).
export default function Cronometro({ className = "" }) {
  const startedAt = useAppStore((s) => s.startedAt);
  const finishedAt = useAppStore((s) => s.finishedAt);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt, finishedAt]);

  const fim = finishedAt ?? agora;
  const ms = startedAt ? fim - startedAt : 0;

  return (
    <span className={`cronometro mono ${className}`} aria-label="Tempo de jogo">
      {formatarTempo(ms)}
    </span>
  );
}
