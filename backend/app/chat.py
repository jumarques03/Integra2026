import json
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from . import db
from .config import OPENAI_API_KEY, OPENAI_MODEL
from .prompts import MARKER, get_prompt
from .schemas import ChatRequest

_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Gatilho enviado ao modelo quando o aluno ainda não mandou nenhuma mensagem,
# só para disparar a "mensagem de boas-vindas" definida no prompt — sem isso
# precisaríamos de uma segunda rota/requisição só para abrir o chat.
_KICKOFF_MESSAGE = "Vamos começar!"


def _event(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


async def stream_chat_response(req: ChatRequest) -> AsyncGenerator[str, None]:
    system_prompt = get_prompt(req.turma)
    if system_prompt is None:
        yield _event({"type": "error", "message": f"Turma desconhecida: {req.turma}"})
        return

    user_message = req.message.strip()
    is_first_turn = len(req.history) == 0 and not user_message

    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": h.role, "content": h.content} for h in req.history]

    if user_message:
        messages.append({"role": "user", "content": user_message})
        await db.save_message(req.session_id, req.turma, "user", user_message)
    elif is_first_turn:
        messages.append({"role": "user", "content": _KICKOFF_MESSAGE})
    else:
        yield _event({"type": "error", "message": "Mensagem vazia."})
        return

    try:
        stream = await _client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            stream=True,
        )
    except Exception as exc:  # erro de rede, chave inválida, etc.
        yield _event({"type": "error", "message": f"Falha ao falar com a OpenAI: {exc}"})
        return

    # Máquina de 3 fases para detectar o MARKER mesmo que ele chegue picado
    # em vários pedacinhos (a API da OpenAI não garante nenhum tamanho de
    # chunk): "deciding" -> ainda não sabemos se é o marcador; "strip_newline"
    # -> marcador confirmado, só falta engolir a quebra de linha que vem
    # logo depois dele (pode chegar num chunk seguinte); "streaming" -> resto
    # do texto é só repassado direto.
    pending = ""
    phase = "deciding"
    completed = False
    display_text = ""

    def _flush(text: str):
        nonlocal display_text
        if text:
            display_text += text
        return _event({"type": "token", "text": text})

    try:
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if not delta:
                continue
            # Sempre acumula no buffer primeiro; cada fase abaixo só decide
            # quanto desse buffer já pode ser liberado.
            pending += delta

            if phase == "deciding":
                if len(pending) < len(MARKER):
                    continue
                if pending.startswith(MARKER):
                    completed = True
                    pending = pending[len(MARKER):]
                    phase = "strip_newline"
                else:
                    phase = "streaming"

            if phase == "strip_newline":
                if not pending:
                    continue
                if pending.startswith("\r\n"):
                    pending = pending[2:]
                elif pending.startswith("\n"):
                    pending = pending[1:]
                phase = "streaming"

            if phase == "streaming" and pending:
                yield _flush(pending)
                pending = ""

        # Fim do stream: resposta terminou sem nunca sair da fase "deciding"
        # (mais curta que o marcador) ou ainda esperando a quebra de linha.
        if pending:
            if phase == "deciding" and pending.startswith(MARKER):
                completed = True
                pending = pending[len(MARKER):]
            if pending:
                yield _flush(pending)
    except Exception as exc:
        yield _event({"type": "error", "message": f"Conexão com a OpenAI caiu: {exc}"})
        return

    if display_text:
        await db.save_message(req.session_id, req.turma, "assistant", display_text)

    yield _event({"type": "done", "completed": completed})
