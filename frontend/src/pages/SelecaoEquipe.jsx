import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import DecorativeBackground from "../components/DecorativeBackground";
import PageTransition from "../components/PageTransition";
import Stepper from "../components/Stepper";
import CircuitLines from "../components/CircuitLines";
import { EQUIPES } from "../data/equipes";
import { useAppStore } from "../store/useAppStore";
import "./SelecaoEquipe.css";

export default function SelecaoEquipe() {
  const navigate = useNavigate();
  const setEquipe = useAppStore((s) => s.setEquipe);

  const handleSelect = (equipe) => {
    setEquipe(equipe);
    navigate("/chat");
  };

  return (
    <PageTransition>
      <div className="screen">
        <DecorativeBackground />
        <div className="screen-content">
          <div className="top-bar">
            <Logo />
            <Stepper step={1} />
            <BackButton to="/inicio" />
          </div>

          <div className="equipe-hero">
            <span className="equipe-tag mono text-green">&lt; etapa_01 /&gt;</span>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ESCOLHA SUA EQUIPE
            </motion.h1>
            <p>selecione a cor do time que você faz parte</p>
          </div>

          <div className="equipe-lines">
            <CircuitLines />
          </div>

          <div className="equipe-grid">
            {EQUIPES.map((equipe, i) => (
              <motion.button
                key={equipe.id}
                type="button"
                className={`equipe-card border-${equipe.cor}`}
                onClick={() => handleSelect(equipe)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <span
                  className={`equipe-circle border-${equipe.cor} fill-${equipe.cor}`}
                />
                <span className="equipe-nome">{equipe.nome}</span>
                <span className="equipe-divider" />
                <span className={`equipe-select text-${equipe.cor}`}>
                  SELECIONAR
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
