import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./BackButton.css";

export default function BackButton({ to }) {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleClick = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      if (to) navigate(to);
      else navigate(-1);
    }, 420);
  };

  return (
    <button
      type="button"
      className="back-btn"
      onClick={handleClick}
      aria-label="Voltar para a tela anterior"
    >
      <AnimatePresence mode="wait">
        {leaving ? (
          <motion.span
            key="label"
            className="back-btn-label mono"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            voltar
          </motion.span>
        ) : (
          <motion.svg
            key="icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            width="20"
            height="14"
            viewBox="0 0 20 14"
            fill="none"
          >
            <line x1="0" y1="1" x2="20" y2="1" stroke="currentColor" strokeWidth="1.6" />
            <line x1="0" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.6" />
            <line x1="0" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="1.6" />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}
