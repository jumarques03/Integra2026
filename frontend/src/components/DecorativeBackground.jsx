import { motion } from "framer-motion";
import "./DecorativeBackground.css";

const SNIPPETS = [
  { text: "10110", top: "8%", left: "4%" },
  { text: "01001010", top: "14%", left: "6%" },
  { text: "11010", top: "20%", left: "8%" },
  { text: "0xFF3A", top: "9%", right: "6%", color: "magenta" },
  { text: "01100", top: "15%", right: "4%", color: "magenta" },
  { text: "11001", top: "21%", right: "9%", color: "magenta" },
  { text: "10011", bottom: "16%", right: "10%", color: "magenta" },
  { text: "0xA204", bottom: "10%", right: "6%" },
];

export default function DecorativeBackground({ variant = "full" }) {
  return (
    <div className="decor-bg" aria-hidden="true">
      <motion.div
        className="decor-blob decor-blob-green"
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="decor-blob decor-blob-magenta"
        animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      {variant === "full" &&
        SNIPPETS.map((s, i) => (
          <span
            key={i}
            className={`decor-snippet mono ${s.color === "magenta" ? "is-magenta" : ""}`}
            style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom }}
          >
            {s.text}
          </span>
        ))}
    </div>
  );
}
