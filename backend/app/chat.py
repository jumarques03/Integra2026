import json
import random
import re
import unicodedata
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from . import db
from .config import OPENAI_API_KEY, OPENAI_MODEL, PALAVRA_PASSE
from .prompts import MARKER, get_prompt
from .schemas import ChatRequest, HistoryMessage

_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Gatilho enviado ao modelo quando o aluno ainda não mandou nenhuma mensagem,
# só para disparar a "mensagem de boas-vindas" definida no prompt — sem isso
# precisaríamos de uma segunda rota/requisição só para abrir o chat.
_KICKOFF_MESSAGE = "Vamos começar!"

# Palavras-chave que liberam UMA dica cada, uma única vez por partida inteira
# (não por enigma). O controle de "já foi usada" é feito aqui em código, em
# cima do histórico da conversa — não depende da IA lembrar sozinha, porque
# ela não faz isso de forma confiável (já testamos e ela se confunde entre
# as duas palavras).
_HINT_WORDS = ("rock", "future")

_REPEATED_WORD_REPLIES = [
    "Você já usou essa palavra nesse jogo! Ela não funciona mais — confia no que você já descobriu até aqui.",
    "Essa palavra-chave já foi usada antes nessa partida, não dá pra usar de novo. Bora continuar tentando!",
    "Essa dica já foi gasta! Ela só funciona uma vez por jogo. Você consegue continuar sem ela!",
]


# A mensagem final de vitória é fixa no prompt. O marcador técnico é a forma
# principal de detectar a vitória, mas a IA às vezes esquece de escrevê-lo; por
# isso a frase da vitória também vale (nunca com o Enigma 5 trancado).
_FRASE_VITORIA = re.compile(r"completou todos os \d+ enigmas|venceu o jogo", re.IGNORECASE)

_RESPOSTAS_AGUARDANDO_SENHA = [
    "Essa não é a palavra-passe. O último enigma continua bloqueado.",
    "Essa palavra não ajuda aqui: o último enigma continua bloqueado até você digitar a palavra-passe.",
]


def _find_hint_words(text: str) -> set[str]:
    low = text.lower()
    return {w for w in _HINT_WORDS if re.search(rf"\b{w}\b", low)}


def _used_hint_words(history: list[HistoryMessage]) -> set[str]:
    used: set[str] = set()
    for i, h in enumerate(history):
        if h.role != "user":
            continue
        proxima = history[i + 1] if i + 1 < len(history) else None
        if proxima and proxima.role == "assistant" and proxima.content in _RESPOSTAS_AGUARDANDO_SENHA:
            continue  # palavra-chave usada com o Enigma 5 trancado: não gasta a dica
        used |= _find_hint_words(h.content)
    return used


def _normalizar_senha(texto: str) -> str:
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFKD", texto) if not unicodedata.combining(c)
    )
    sem_pontas = re.sub(r"^\W+|\W+$", "", sem_acento.lower())
    return re.sub(r"\s+", " ", sem_pontas)


_SENHA_NORMALIZADA = _normalizar_senha(PALAVRA_PASSE)


def _e_palavra_passe(texto: str) -> bool:
    # A mensagem INTEIRA precisa ser a palavra-passe (ignora maiúsculas,
    # acentos, espaços repetidos e pontuação nas pontas, ex: "Hands On!").
    # Frase que apenas contém as palavras, ou variações, NÃO libera.
    return _normalizar_senha(texto) == _SENHA_NORMALIZADA


def _estado_portao(history: list[HistoryMessage], mensagem: str) -> tuple[bool, bool, bool, bool]:
    """Devolve (aguardando, desbloqueado, senha_agora, senha_repetida).

    A palavra-passe só vale DEPOIS que a IA avisou que o Enigma 5 está
    bloqueado (o aviso sempre cita "palavra-passe"). Digitá-la antes da hora,
    por exemplo no Enigma 1, não libera nada e não fica guardada.
    """
    aguardando = False
    desbloqueado = False
    for h in history:
        if h.role == "assistant":
            if "palavra-passe" in h.content.lower():
                aguardando = True
        elif aguardando and _e_palavra_passe(h.content):
            desbloqueado = True
    e_senha = bool(mensagem) and _e_palavra_passe(mensagem)
    senha_agora = e_senha and aguardando and not desbloqueado
    senha_repetida = e_senha and desbloqueado
    return aguardando, desbloqueado or senha_agora, senha_agora, senha_repetida


def _event(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


async def stream_chat_response(req: ChatRequest) -> AsyncGenerator[str, None]:
    user_message = req.message.strip()

    # O Enigma 5 só é liberado quando uma mensagem do aluno, enviada DEPOIS do
    # aviso de bloqueio, é a palavra-passe. Enquanto isso não acontece, o texto
    # dele nem entra no prompt da IA.
    aguardando, desbloqueado, senha_agora, senha_repetida = _estado_portao(
        req.history, user_message
    )

    system_prompt = get_prompt(req.turma, desbloqueado)
    if system_prompt is None:
        yield _event({"type": "error", "message": f"Turma desconhecida: {req.turma}"})
        return

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

    if senha_agora or senha_repetida:
        if senha_repetida:
            aviso = (
                "[sinal do sistema, confirmado por código — não é o aluno falando] "
                "O aluno repetiu a palavra-passe, que já tinha sido aceita antes. O Enigma 5 "
                "continua liberado. Não trate isso como tentativa de resposta nem diga \"Não é isso\": "
                "responda curto e reapresente o enigma atual completo."
            )
        else:
            aviso = (
                "[sinal do sistema, confirmado por código — não é o aluno falando] "
                "O aluno acabou de digitar a palavra-passe CORRETA: o Enigma 5 está LIBERADO "
                "(o texto dele agora está no seu prompt). Se o aluno já resolveu o Enigma 4, "
                "comemore a palavra-passe em uma frase curta e apresente o Enigma 5 COMPLETO agora, "
                "na mesma resposta. Se o Enigma 4 (ou algum anterior) ainda não foi resolvido, "
                "não pule enigmas: agradeça, reapresente o enigma atual completo e só apresente "
                "o Enigma 5 logo depois que o Enigma 4 for resolvido, sem pedir a palavra-passe de novo."
            )
        messages.append({"role": "system", "content": aviso})

    if user_message:
        used_before = _used_hint_words(req.history)
        words_now = _find_hint_words(user_message)
        fresh_words = words_now - used_before
        repeated_words = words_now & used_before

        # Esperando a palavra-passe (Enigma 4 resolvido, Enigma 5 trancado):
        # não existe dica para dar, então responde direto, sem chamar a IA.
        if words_now and not desbloqueado and aguardando:
            reply = random.choice(_RESPOSTAS_AGUARDANDO_SENHA)
            await db.save_message(req.session_id, req.turma, "assistant", reply)
            yield _event({"type": "token", "text": reply})
            yield _event({"type": "done", "completed": False})
            return

        # Só palavra(s) repetida(s) e nenhuma nova: nem chama a IA, responde
        # direto — assim a recusa é garantida por código, não depende da IA
        # "lembrar" certo (na prática ela às vezes se confundia entre as
        # duas palavras).
        if repeated_words and not fresh_words:
            reply = random.choice(_REPEATED_WORD_REPLIES)
            await db.save_message(req.session_id, req.turma, "assistant", reply)
            yield _event({"type": "token", "text": reply})
            yield _event({"type": "done", "completed": False})
            return

        if fresh_words:
            palavra = next(iter(fresh_words))
            messages.append({
                "role": "system",
                "content": (
                    f'[sinal do sistema, confirmado por código — não é o aluno falando] '
                    f'A palavra-chave de dica "{palavra}" está sendo usada PELA PRIMEIRA VEZ '
                    f"nesta conversa inteira (o sistema já conferiu isso, não é uma suposição "
                    f'sua). Dê a dica do enigma atual normalmente, seguindo a REGRA DE DICAS. '
                    f"O enigma atual é SEMPRE o último que você apresentou nesta conversa e que "
                    f"ainda não foi resolvido (nunca a dica de um enigma anterior já resolvido). "
                    f"Não se confunda com o uso de nenhuma outra palavra-chave em momentos "
                    f"anteriores desta conversa — essa aqui, \"{palavra}\", é nova."
                ),
            })

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

    if _FRASE_VITORIA.search(display_text):
        completed = True

    # Sem a palavra-passe o Enigma 5 não existe: mesmo que a IA diga que o
    # aluno venceu (ou invente um "Enigma 5"), a vitória não é registrada.
    yield _event({"type": "done", "completed": completed and desbloqueado})
