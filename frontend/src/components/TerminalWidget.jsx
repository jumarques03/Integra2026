import { useEffect, useState } from "react";
import "./TerminalWidget.css";

const LINES = [
  "$ decrypt --enigma",
  "acessando núcleo...",
  "[||||||||__] 82%",
  "status: decodificando",
];

export default function TerminalWidget() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= LINES.length) return;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), 550);
    return () => clearTimeout(t);
  }, [visibleLines]);

  return (
    <div className="terminal-widget mono">
      <div className="terminal-dots">
        <span className="dot dot-magenta" />
        <span className="dot dot-yellow" />
        <span className="dot dot-green" />
      </div>
      <div className="terminal-body">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <p
            key={i}
            className={
              line.startsWith("status")
                ? "line-magenta"
                : line.startsWith("[")
                ? "line-green"
                : ""
            }
          >
            {line}
          </p>
        ))}
        <p className="terminal-prompt">
          &gt; aguardando input_<span className="cursor">|</span>
        </p>
      </div>
    </div>
  );
}
