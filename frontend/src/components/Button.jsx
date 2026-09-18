import { motion } from "framer-motion";
import "./Button.css";

export default function Button({
  children,
  color = "green",
  onClick,
  type = "button",
  disabled = false,
  size = "md",
}) {
  return (
    <motion.button
      type={type}
      className={`btn-outline color-${color} size-${size}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}
