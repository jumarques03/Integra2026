import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import DecorativeBackground from "../components/DecorativeBackground";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import { useAppStore } from "../store/useAppStore";
import "./Resultado.css";

export default function Resultado() {
  const navigate = useNavigate();
  const equipe = useAppStore((s) => s.equipe);
  const startedAt = useAppStore((s) => s.startedAt);
  const getElapsedMinutes = useAppStore((s) => s.getElapsedMinutes);
  const reset = useAppStore((s) => s.reset);

  useEffect(() => {
    if (!startedAt) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt]);

  if (!startedAt) return null;

  const minutos = getElapsedMinutes();
  const cor = equipe?.cor ?? "green";

  const handleReiniciar = () => {
    reset();
    navigate("/");
  };

  return (
    <PageTransition>
      <div className="screen">
        <DecorativeBackground />
        <div className="screen-content resultado-content">
          <div className="top-bar">
            <Logo />
          </div>

          <div className="resultado-center">
            <motion.div
              className={`resultado-lock text-${cor}`}
              initial={{ scale: 0.4, opacity: 0, rotate: -25 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 12 }}
            >
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
                <rect
                  x="5"
                  y="11"
                  width="14"
                  height="9"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path d="M8 11V8a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="15" r="1.4" fill="currentColor" />
              </svg>
            </motion.div>

            <span className={`resultado-tag mono text-${cor}`}>
              &lt; acesso_concedido /&gt;
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              VOCÊ DESVENDOU
              <br />O ENIGMA
            </motion.h1>

            <motion.div
              className="resultado-tempo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="resultado-em">EM</span>
              <span className={`resultado-minutos text-${cor}`}>{minutos}</span>
              <span className="resultado-label">MINUTOS</span>
            </motion.div>

            <Button color={cor} size="lg" onClick={handleReiniciar}>
              REINICIAR
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
