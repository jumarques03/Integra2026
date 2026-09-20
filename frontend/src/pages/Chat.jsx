import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import DecorativeBackground from "../components/DecorativeBackground";
import PageTransition from "../components/PageTransition";
import Stepper from "../components/Stepper";
import TabGuardOverlay from "../components/TabGuardOverlay";
import { useTabGuard } from "../hooks/useTabGuard";
import { MENSAGENS_INICIAIS, RESPOSTAS_ENIGMA } from "../data/chatScript";
import { useAppStore } from "../store/useAppStore";
import "./Chat.css";

function formatHora(date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const navigate = useNavigate();
  const equipe = useAppStore((s) => s.equipe);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const finish = useAppStore((s) => s.finish);
  const desclassificar = useAppStore((s) => s.desclassificar);
  const desclassificado = useAppStore((s) => s.desclassificado);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const bottomRef = useRef(null);
  const responseIndex = useRef(0);
  const seeded = useRef(false);

  const cor = equipe?.cor ?? "green";

  const handleDisqualify = useCallback(() => {
    desclassificar();
    navigate("/desclassificado");
  }, [desclassificar, navigate]);

  const { avisoAtivo, aguardandoConfirmacao, segundosRestantes, confirmarVolta } = useTabGuard({
    enabled: Boolean(equipe) && !desclassificado,
    onDisqualify: handleDisqualify,
  });

  useEffect(() => {
    if (!equipe) {
      navigate("/equipe");
      return;
    }
    if (seeded.current) return;
    seeded.current = true;

    MENSAGENS_INICIAIS.forEach((texto, i) => {
      setTimeout(() => {
        addMessage({
          id: `bot-init-${i}`,
          from: "bot",
          text: texto,
          time: formatHora(new Date()),
        });
      }, 300 + i * 700);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = () => {
    const texto = input.trim();
    if (!texto) return;

    addMessage({
      id: `user-${Date.now()}`,
      from: "user",
      text: texto,
      time: formatHora(new Date()),
    });
    setInput("");
    setUserTurns((n) => n + 1);
    setTyping(true);

    setTimeout(() => {
      const resposta = RESPOSTAS_ENIGMA[responseIndex.current % RESPOSTAS_ENIGMA.length];
      responseIndex.current += 1;
      setTyping(false);
      addMessage({
        id: `bot-${Date.now()}`,
        from: "bot",
        text: resposta,
        time: formatHora(new Date()),
      });
    }, 1100 + Math.random() * 500);
  };

  const handleConcluir = () => {
    finish();
    navigate("/resultado");
  };

  if (!equipe) return null;

  return (
    <PageTransition>
      <div className={`screen chat-screen theme-${cor}`}>
        {avisoAtivo && (
          <TabGuardOverlay
            segundos={segundosRestantes}
            aguardandoConfirmacao={aguardandoConfirmacao}
            onConfirmar={confirmarVolta}
          />
        )}
        <DecorativeBackground variant="chat" />
        <div className="screen-content">
          <div className="top-bar chat-top-bar">
            <div className="chat-brand">
              <Logo code={null} />
              <span className="chat-status">
                <i className="chat-status-dot" /> ONLINE AGORA
              </span>
            </div>
            <Stepper step={2} />
            <BackButton to="/equipe" />
          </div>

          <div className="chat-etapa mono text-green">&lt; etapa_02 /&gt;</div>

          <div className="chat-body">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`chat-row ${msg.from === "user" ? "is-user" : "is-bot"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {msg.from === "bot" && <span className="chat-avatar bot-avatar">&gt;_</span>}
                <div className="chat-bubble">
                  <p>{msg.text}</p>
                  <span className="chat-time">{msg.time}</span>
                </div>
                {msg.from === "user" && (
                  <span className="chat-avatar user-avatar">
                    {equipe.nome.charAt(0)}
                  </span>
                )}
              </motion.div>
            ))}

            <AnimatePresence>
              {typing && (
                <motion.div
                  className="chat-row is-bot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="chat-avatar bot-avatar">&gt;_</span>
                  <div className="chat-bubble typing-bubble">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          <div className="chat-footer">
            <button
              type="button"
              className="chat-conclude"
              disabled={userTurns === 0}
              onClick={handleConcluir}
            >
              CONCLUIR DESAFIO →
            </button>
            <div className="chat-input-row">
              <input
                type="text"
                value={input}
                placeholder="digite sua mensagem..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button type="button" className="chat-send" onClick={handleSend} aria-label="Enviar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h13M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
