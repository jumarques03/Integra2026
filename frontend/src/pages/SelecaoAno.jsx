import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import DecorativeBackground from "../components/DecorativeBackground";
import PageTransition from "../components/PageTransition";
import { ANOS } from "../data/anos";
import { useAppStore } from "../store/useAppStore";
import "./SelecaoAno.css";

export default function SelecaoAno() {
  const navigate = useNavigate();
  const setAno = useAppStore((s) => s.setAno);

  const handleSelect = (ano) => {
    setAno(ano);
    navigate("/inicio");
  };

  return (
    <PageTransition>
      <div className="screen">
        <DecorativeBackground />
        <div className="screen-content">
          <div className="top-bar">
            <Logo />
          </div>

          <div className="ano-main">
            <div className="ano-hero">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                SELECIONE O ANO
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                o enigma se ajusta ao ano correspondente
              </motion.p>
            </div>

            <div className="ano-grid">
              {ANOS.map((ano, i) => (
                <motion.button
                  key={ano.id}
                  type="button"
                  className={`ano-card border-${ano.cor} hoverfill-${ano.cor}`}
                  onClick={() => handleSelect(ano)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <span className={`ano-badge border-${ano.cor} text-${ano.cor}`}>
                    {ano.numero}
                  </span>
                  <span className="ano-title">{ano.titulo}</span>
                  <span className="ano-subtitle">{ano.subtitulo}</span>
                  <span className="ano-divider" />
                  <span className={`ano-select text-${ano.cor}`}>SELECIONAR</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
