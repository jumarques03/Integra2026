import circuitLines from "../assets/circuit-lines.svg";
import "./CircuitLines.css";

export default function CircuitLines({ className = "", flip = false }) {
  return (
    <img
      src={circuitLines}
      alt=""
      aria-hidden="true"
      className={`circuit-lines ${flip ? "is-flipped" : ""} ${className}`}
    />
  );
}
