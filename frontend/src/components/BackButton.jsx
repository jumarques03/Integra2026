import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
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
          <motion.span
            key="icon"
            className="back-btn-icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FaArrowLeft size={18} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
