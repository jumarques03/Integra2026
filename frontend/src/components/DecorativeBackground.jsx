import { motion } from "framer-motion";
import "./DecorativeBackground.css";

const SNIPPETS_FULL = [
  { text: "10110", top: "16%", left: "4%" },
  { text: "01001010", top: "22%", left: "6%" },
  { text: "11010", top: "28%", left: "8%" },
  { text: "0x2F91", top: "38%", left: "3%" },
  { text: "01011", top: "68%", left: "5%" },
  { text: "10100110", top: "78%", left: "7%" },
  { text: "0xB61C", bottom: "8%", left: "5%" },
  { text: "0xFF3A", top: "16%", right: "6%", color: "magenta" },
  { text: "01100", top: "22%", right: "4%", color: "magenta" },
  { text: "11001", top: "28%", right: "9%", color: "magenta" },
  { text: "0x7D2A", top: "38%", right: "3%", color: "magenta" },
  { text: "10011", bottom: "16%", right: "10%", color: "magenta" },
  { text: "0xA204", bottom: "10%", right: "6%" },
  { text: "11101001", bottom: "26%", right: "4%", color: "magenta" },
];

const SNIPPETS_CHAT = [
  { text: "10110", top: "22%", left: "1.5%" },
  { text: "0x2F91", top: "42%", left: "1.5%" },
  { text: "01011", top: "64%", left: "1.5%" },
  { text: "0xFF3A", top: "30%", right: "1.5%", color: "magenta" },
  { text: "11001", top: "52%", right: "1.5%", color: "magenta" },
  { text: "0xA204", top: "72%", right: "1.5%", color: "magenta" },
];

const SNIPPETS_HERO = [
  { text: "</>", top: "10%", left: "6%" },
  { text: "10110", top: "22%", left: "4%" },
  { text: "{ }", top: "40%", left: "6%" },
  { text: "0x2F91", top: "56%", left: "4%" },
  { text: "const();", top: "9%", right: "5%", color: "magenta" },
  { text: "01100", top: "22%", right: "7%", color: "magenta" },
  { text: "fetch()", top: "40%", right: "5%", color: "magenta" },
  { text: "0xA204", top: "56%", right: "7%", color: "magenta" },
];

export default function DecorativeBackground({ variant = "full" }) {
  const snippets =
    variant === "full"
      ? SNIPPETS_FULL
      : variant === "chat"
        ? SNIPPETS_CHAT
        : variant === "hero"
          ? SNIPPETS_HERO
          : [];

  return (
    <div className="decor-bg" aria-hidden="true">
      <motion.div
        className="decor-blob decor-blob-green"
        animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="decor-blob decor-blob-magenta"
        animate={{ opacity: [0.6, 0.95, 0.6], scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="decor-blob decor-blob-green-soft"
        animate={{ opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="decor-blob decor-blob-magenta-soft"
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      {snippets.map((s, i) => (
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
