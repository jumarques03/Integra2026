import { motion } from "framer-motion";
import "./TabGuardOverlay.css";

export default function TabGuardOverlay({ segundos }) {
  return (
    <motion.div
      className="tabguard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="tabguard-icon"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3 2 20h20L12 3Z"
            stroke="var(--magenta)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 10v4" stroke="var(--magenta)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1" fill="var(--magenta)" />
        </svg>
      </motion.div>

      <span className="tabguard-tag mono">&lt; aviso_seguranca /&gt;</span>
      <h2>VOLTE PARA A ABA</h2>
      <p>
        você será <strong>desclassificado</strong> se não retornar em
      </p>
      <span className="tabguard-count mono">{segundos}s</span>
    </motion.div>
  );
}
