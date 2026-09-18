import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import DecorativeBackground from "../components/DecorativeBackground";
import PageTransition from "../components/PageTransition";
import TerminalWidget from "../components/TerminalWidget";
import Button from "../components/Button";
import CircuitLines from "../components/CircuitLines";
import "./TelaInicial.css";

const TAGS = ["LÓGICA", "TECNOLOGIA", "ENIGMA", "INTELIGÊNCIA"];

export default function TelaInicial() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="screen">
        <DecorativeBackground />
        <div className="screen-content">
          <div className="top-bar">
            <Logo />
            <BackButton to="/" />
          </div>

          <div className="hero-center">
            <motion.span
              className="hero-tag mono text-green"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              &lt; fiap_school /&gt;
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              AI MISTERY
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="hero-subtitle"
            >
              INTEGRA 2026
            </motion.p>

            <motion.div
              className="hero-tags"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.24 }}
            >
              {TAGS.map((tag, i) => (
                <span key={tag}>
                  {tag}
                  {i !== TAGS.length - 1 && <i className="hero-tag-dot" />}
                </span>
              ))}
            </motion.div>
          </div>

          <div className="hero-lines">
            <CircuitLines />
          </div>

          <div className="hero-footer">
            <div className="hero-footer-side hero-footer-start">
              <TerminalWidget />
            </div>

            <Button
              color="green"
              size="lg"
              onClick={() => navigate("/equipe")}
            >
              COMEÇAR
            </Button>

            <div className="hero-footer-side hero-footer-end">
              <motion.div
                className="hero-lock"
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="var(--magenta)"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 10V7a4 4 0 1 1 8 0v3"
                    stroke="var(--magenta)"
                    strokeWidth="1.6"
                  />
                  <circle cx="12" cy="15" r="1.6" fill="var(--magenta)" />
                </svg>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
