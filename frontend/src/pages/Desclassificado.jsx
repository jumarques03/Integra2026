import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import DecorativeBackground from "../components/DecorativeBackground";
import PageTransition from "../components/PageTransition";
import Button from "../components/Button";
import { useAppStore } from "../store/useAppStore";
import "./Desclassificado.css";

export default function Desclassificado() {
  const navigate = useNavigate();
  const desclassificado = useAppStore((s) => s.desclassificado);
  const reset = useAppStore((s) => s.reset);

  useEffect(() => {
    if (!desclassificado) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desclassificado]);

  if (!desclassificado) return null;

  const handleReiniciar = () => {
    reset();
    navigate("/");
  };

  return (
    <PageTransition>
      <div className="screen">
        <DecorativeBackground />
        <div className="screen-content">
          <div className="top-bar">
            <Logo />
          </div>

          <div className="desc-center">
            <motion.div
              className="desc-icon"
              initial={{ scale: 0.4, opacity: 0, rotate: 20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 12 }}
            >
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="var(--magenta)" strokeWidth="1.6" />
                <path
                  d="M9 9l6 6M15 9l-6 6"
                  stroke="var(--magenta)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            <span className="desc-tag mono text-magenta">
              &lt; acesso_negado /&gt;
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              VOCÊ FOI
              <br />
              DESCLASSIFICADO
            </motion.h1>

            <p className="desc-subtitle">
              você saiu da aba do desafio por tempo demais.
            </p>

            <Button color="magenta" onClick={handleReiniciar}>
              REINICIAR
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
