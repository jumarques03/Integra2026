import { motion } from "framer-motion";
import "./Stepper.css";

export default function Stepper({ step, total = 3 }) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="stepper">
      {dots.map((dot, i) => (
        <div className="stepper-item" key={dot}>
          <motion.span
            className={`stepper-dot ${dot <= step ? "is-active" : ""}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          />
          {dot !== total && (
            <span
              className={`stepper-line ${dot < step ? "is-active" : ""}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
