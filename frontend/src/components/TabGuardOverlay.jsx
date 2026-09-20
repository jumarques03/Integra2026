import { motion } from "framer-motion";
import "./TabGuardOverlay.css";

export default function TabGuardOverlay({ segundos, aguardandoConfirmacao, onConfirmar }) {
  return (
    <motion.div
      className="tabguard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {aguardandoConfirmacao ? (
        <>
          <motion.div
            className="tabguard-icon"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--green)" strokeWidth="1.6" />
              <path
                d="M8 12.5l2.5 2.5L16 9.5"
                stroke="var(--green)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <span className="tabguard-tag mono text-green">&lt; de_volta /&gt;</span>
          <h2>VOCÊ VOLTOU</h2>
          <p>
            faltavam <strong className="text-green">{segundos}s</strong> pra desclassificação
          </p>
          <span className="tabguard-count mono text-green">{segundos}s</span>
          <button type="button" className="tabguard-btn" onClick={onConfirmar}>
            VOLTAR AO DESAFIO
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </motion.div>
  );
}
