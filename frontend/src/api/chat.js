const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Converte as mensagens do jeito que a UI guarda ({from:"user"|"bot", text})
// para o formato que o backend espera ({role:"user"|"assistant", content}).
function toHistory(messages) {
  return messages
    .filter((m) => m.text)
    .map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }));
}

/**
 * Chama o backend em streaming (NDJSON: uma linha JSON por evento).
 * Eventos possíveis: {type:"token", text}, {type:"done", completed},
 * {type:"error", message}.
 *
 * @param {{sessionId:string, turma:string, messages:Array, userMessage?:string,
 *   onToken:(text:string)=>void, onDone:(completed:boolean)=>void,
 *   onError:(message:string)=>void}} params
 */
export async function streamChat({
  sessionId,
  turma,
  messages,
  userMessage = "",
  onToken,
  onDone,
  onError,
}) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        turma,
        history: toHistory(messages),
        message: userMessage,
      }),
    });
  } catch {
    onError("Não consegui falar com o servidor. Ele está rodando?");
    return;
  }

  if (!response.ok || !response.body) {
    onError(`O servidor respondeu com erro (${response.status}).`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line) => {
    if (!line.trim()) return;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      return;
    }
    if (event.type === "token") onToken(event.text);
    else if (event.type === "done") onDone(Boolean(event.completed));
    else if (event.type === "error") onError(event.message);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    lines.forEach(handleLine);
  }
  if (buffer.trim()) handleLine(buffer);
}
