import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import DecorativeBackground from "../components/DecorativeBackground";
import PageTransition from "../components/PageTransition";
import Stepper from "../components/Stepper";
import TabGuardOverlay from "../components/TabGuardOverlay";
import { useTabGuard } from "../hooks/useTabGuard";
import { streamChat } from "../api/chat";
import { useAppStore } from "../store/useAppStore";
import "./Chat.css";

function formatHora(date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const navigate = useNavigate();
  const ano = useAppStore((s) => s.ano);
  const equipe = useAppStore((s) => s.equipe);
  const sessionId = useAppStore((s) => s.sessionId);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const updateMessageText = useAppStore((s) => s.updateMessageText);
  const finish = useAppStore((s) => s.finish);
  const desclassificar = useAppStore((s) => s.desclassificar);
  const desclassificado = useAppStore((s) => s.desclassificado);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
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

  // Manda um turno (mensagem do aluno, ou "" para disparar as boas-vindas)
  // pro backend e vai encaixando os pedaços do streaming na bolha do bot.
  const runTurn = (userText) => {
    setSending(true);

    if (userText) {
      addMessage({
        id: `user-${Date.now()}`,
        from: "user",
        text: userText,
        time: formatHora(new Date()),
      });
    }

    const botId = `bot-${Date.now()}`;
    addMessage({ id: botId, from: "bot", text: "", time: formatHora(new Date()) });

    streamChat({
      sessionId,
      turma: ano.turmaKey,
      messages,
      userMessage: userText,
      onToken: (chunk) => updateMessageText(botId, (prev) => prev + chunk),
      onDone: (completed) => {
        setSending(false);
        if (completed) {
          finish();
          setTimeout(() => navigate("/resultado"), 1800);
        }
      },
      onError: (msg) => {
        updateMessageText(botId, (prev) => prev || `Ops, ${msg}`);
        setSending(false);
      },
    });
  };

  useEffect(() => {
    if (!equipe || !ano) {
      navigate("/equipe");
      return;
    }
    if (seeded.current) return;
    seeded.current = true;
    if (messages.length === 0) {
      runTurn("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipe, ano]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const texto = input.trim();
    if (!texto || sending) return;
    setInput("");
    runTurn(texto);
  };

  if (!equipe || !ano) return null;

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
                  {msg.text ? (
                    <p>{msg.text}</p>
                  ) : (
                    <div className="typing-bubble">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  )}
                  {msg.text && <span className="chat-time">{msg.time}</span>}
                </div>
                {msg.from === "user" && (
                  <span className="chat-avatar user-avatar">
                    {equipe.nome.charAt(0)}
                  </span>
                )}
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-footer">
            <div className="chat-input-row">
              <input
                type="text"
                value={input}
                placeholder="digite sua mensagem..."
                disabled={sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                type="button"
                className="chat-send"
                onClick={handleSend}
                disabled={sending}
                aria-label="Enviar"
              >
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
