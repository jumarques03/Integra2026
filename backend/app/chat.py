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

    # Busca o MARKER em qualquer posição do texto (a IA nem sempre obedece a
    # instrução de colocá-lo estritamente antes de qualquer outra palavra —
    # às vezes escreve algo antes). Sempre que ele aparecer, marca completed
    # e remove o marcador (e a quebra de linha logo depois dele) do texto
    # exibido, mesmo que venha picado em vários chunks: só liberamos o texto
    # já confirmado como "não faz parte do marcador", segurando as últimas
    # len(MARKER)-1 letras no buffer até a próxima rodada.
    pending = ""
    completed = False
    display_text = ""
    hold = len(MARKER) - 1

    def _flush(text: str):
        nonlocal display_text
        if text:
            display_text += text
        return _event({"type": "token", "text": text})

    # Se o marcador for consumido sem ainda sabermos o que vem depois dele
    # (ex: chegou sozinho num chunk), esperamos o próximo pedaço de texto
    # para decidir se engolimos uma quebra de linha logo em seguida.
    awaiting_newline_strip = False

    def _consume_marker(text: str) -> tuple[str, bool, bool]:
        idx = text.find(MARKER)
        if idx == -1:
            return text, False, False
        before = text[:idx]
        after = text[idx + len(MARKER):]
        if after == "":
            return before, True, True
        if after.startswith("\r\n"):
            after = after[2:]
        elif after.startswith("\n"):
            after = after[1:]
        return before + after, True, False

    try:
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if not delta:
                continue

            if awaiting_newline_strip:
                if delta.startswith("\r\n"):
                    delta = delta[2:]
                elif delta.startswith("\n"):
                    delta = delta[1:]
                awaiting_newline_strip = False

            pending += delta

            pending, found, awaiting_newline_strip = _consume_marker(pending)
            if found:
                completed = True

            # Só libera o que já sabemos com certeza que não é (nem começo de)
            # o marcador; segura o resto para a próxima iteração.
            if len(pending) > hold:
                flush_len = len(pending) - hold
                yield _flush(pending[:flush_len])
                pending = pending[flush_len:]

        if pending:
            pending, found, _ = _consume_marker(pending)
            if found:
                completed = True
            if pending:
                yield _flush(pending)
    except Exception as exc:
        yield _event({"type": "error", "message": f"Conexão com a OpenAI caiu: {exc}"})
        return

    if display_text:
        await db.save_message(req.session_id, req.turma, "assistant", display_text)

    yield _event({"type": "done", "completed": completed})
