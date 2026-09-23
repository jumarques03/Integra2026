# AI MYSTERY — INTEGRA 2026

Jogo de enigmas gamificado com IA, feito para o evento **INTEGRA 2026** da FIAP School. Cada turma de alunos escolhe sua equipe (cor), e conversa com um chatbot ("Mestre do Mistério") que propõe enigmas sequenciais adequados à faixa etária. Quando a equipe resolve todos os enigmas, o sistema libera a tela de vitória com o tempo gasto. Se alguém trocar de aba/minimizar a janela por tempo demais durante o desafio, a equipe é desclassificada.

É um monorepo com duas partes independentes:

- **`frontend/`** — SPA em React (Vite) que roda as telas do jogo.
- **`backend/`** — API em Python (FastAPI) que conversa com a OpenAI e guarda o histórico das conversas.

---

## Sumário

- [Arquitetura geral](#arquitetura-geral)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Fluxo do jogo (passo a passo)](#fluxo-do-jogo-passo-a-passo)
- [Como funciona o chat com a IA](#como-funciona-o-chat-com-a-ia)
- [Guarda de aba (anti-cola)](#guarda-de-aba-anti-cola)
- [Persistência de estado no navegador](#persistência-de-estado-no-navegador)
- [Como rodar o projeto](#como-rodar-o-projeto)
  - [1. Backend](#1-backend)
  - [2. Frontend](#2-frontend)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como editar os enigmas de cada turma](#como-editar-os-enigmas-de-cada-turma)
- [Erros comuns e como resolver](#erros-comuns-e-como-resolver)
- [Banco de dados](#banco-de-dados)
- [Scripts úteis](#scripts-úteis)

---

## Arquitetura geral

```
┌─────────────────────────┐        POST /api/chat         ┌──────────────────────────┐        chat.completions        ┌────────────┐
│   Frontend (React/Vite) │  ─────────────────────────────▶ │   Backend (FastAPI)       │ ───────────────────────────▶ │   OpenAI    │
│   localhost:5173        │  ◀───────────────────────────── │   localhost:8000          │ ◀─────────────────────────── │   API       │
│                          │   NDJSON em streaming            │                            │        stream=True           └────────────┘
└─────────────────────────┘                                  │  salva cada mensagem em   │
                                                               │  SQLite (histórico)       │
                                                               └──────────────────────────┘
                                                                          │
                                                                          ▼
                                                              backend/data/conversations.db
```

- O **frontend** nunca fala com a OpenAI diretamente — ele só conversa com o backend, que guarda a `OPENAI_API_KEY` em segredo.
- O **backend** é praticamente um proxy inteligente: recebe `{turma, session_id, history, message}`, monta o prompt de sistema certo para a turma, chama a OpenAI em streaming e repassa os tokens para o frontend em tempo real (NDJSON: uma linha JSON por evento).
- O **frontend** guarda o progresso do jogador no `localStorage` (via Zustand), então recarregar a página no meio de uma partida não perde o progresso.
- Não existe autenticação/login: a "sessão" é só um UUID gerado no navegador quando a equipe é escolhida.

---

## Estrutura de pastas

```
Integra2026/
├── iniciar.bat                # duplo clique: sobe backend + frontend e abre o navegador
├── parar.bat                  # duplo clique: derruba tudo
├── backend/
│   ├── app/
│   │   ├── main.py            # cria o FastAPI app, CORS, rotas /api/health e /api/chat
│   │   ├── chat.py            # lógica de streaming: chama a OpenAI e repassa tokens ao frontend
│   │   ├── config.py          # lê o .env (chave da OpenAI, modelo, CORS, caminho do banco)
│   │   ├── db.py              # cria a tabela SQLite e salva cada mensagem trocada
│   │   ├── schemas.py         # modelos Pydantic do request (ChatRequest, HistoryMessage)
│   │   └── prompts/
│   │       ├── __init__.py    # mapeia turma -> arquivo .md e injeta o "marcador de vitória"
│   │       ├── fundamental1_4.md    # prompt/enigmas do 4º ano
│   │       ├── fundamental1_5.md    # prompt/enigmas do 5º ano
│   │       ├── fundamental2_67.md   # prompt/enigmas do 6º ao 7º ano
│   │       ├── fundamental2_89.md   # prompt/enigmas do 8º ao 9º ano
│   │       ├── medio_regular.md     # prompt/enigmas do Ensino Médio Regular
│   │       └── medio_tecnico.md     # prompt/enigmas do Ensino Médio Técnico
│   ├── data/
│   │   └── conversations.db   # banco SQLite (gerado automaticamente, não versionado)
│   ├── requirements.txt       # dependências Python
│   ├── .env                   # segredos locais (NÃO commitar — já está no .gitignore)
│   └── .env.example           # modelo do .env
│
└── frontend/
    ├── src/
    │   ├── main.jsx            # bootstrap do React + BrowserRouter
    │   ├── App.jsx             # define as rotas (telas) da SPA
    │   ├── api/
    │   │   └── chat.js         # chama POST /api/chat e faz o parsing do streaming NDJSON
    │   ├── store/
    │   │   └── useAppStore.js  # estado global (Zustand + persist no localStorage)
    │   ├── data/
    │   │   ├── anos.js         # lista de anos/séries disponíveis (liga ao `turma` do backend)
    │   │   └── equipes.js      # lista de equipes/cores disponíveis
    │   ├── utils/
    │   │   └── tempo.js        # formata milissegundos em mm:ss
    │   ├── hooks/
    │   │   └── useTabGuard.js  # detecta troca de aba/minimização e desclassifica após 10s
    │   ├── pages/
    │   │   ├── SelecaoAno.jsx       # tela 0: escolher o ano/série (define a `turma`)
    │   │   ├── TelaInicial.jsx      # tela de apresentação do jogo (botão "Começar")
    │   │   ├── SelecaoEquipe.jsx    # tela 1: escolher a cor da equipe (cria a sessão)
    │   │   ├── Chat.jsx             # tela 2: chat com a IA, onde o enigma é resolvido
    │   │   ├── Resultado.jsx        # tela de vitória (mostra tempo total)
    │   │   └── Desclassificado.jsx  # tela de desclassificação (saiu da aba por tempo demais)
    │   └── components/          # peças de UI reutilizáveis (botões, fundo decorativo,
    │                             # indicador de etapas, logo, avisos, etc.)
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env                     # URL da API local (NÃO commitar)
    └── .env.example
```

---

## Fluxo do jogo (passo a passo)

As rotas são todas client-side (React Router), definidas em [`frontend/src/App.jsx`](frontend/src/App.jsx):

1. **`/` — [SelecaoAno.jsx](frontend/src/pages/SelecaoAno.jsx)**
   Tela inicial. O aluno escolhe o ano/série (define `ano.turmaKey`, que é a chave usada pelo backend para escolher o prompt certo). A grade de anos sempre aparece (dá para voltar até aqui mesmo com o chat em andamento). Escolher o **mesmo ano** da partida atual retoma de onde parou; escolher **outro ano** reinicia tudo do zero para aquele ano.

2. **`/inicio` — [TelaInicial.jsx](frontend/src/pages/TelaInicial.jsx)**
   Tela de apresentação ("AI MYSTERY"). Só tem o botão **COMEÇAR**.

3. **`/equipe` — [SelecaoEquipe.jsx](frontend/src/pages/SelecaoEquipe.jsx)**
   O aluno escolhe a cor da equipe. Ao escolher uma equipe nova, `setEquipe()` (em [useAppStore.js](frontend/src/store/useAppStore.js)) gera um novo `sessionId` (UUID) e zera as mensagens. Escolher **a mesma equipe** de uma partida já iniciada (ex: voltou do chat sem querer) retoma a partida sem zerar nada, nem o cronômetro.

4. **`/chat` — [Chat.jsx](frontend/src/pages/Chat.jsx)**
   Tela principal do jogo. Ao entrar, dispara automaticamente uma primeira chamada ao backend com mensagem vazia (isso é o "gatilho" que faz a IA mandar a mensagem de boas-vindas do enigma, sem precisar de uma rota separada). Cada mensagem do aluno é enviada via `streamChat()` ([api/chat.js](frontend/src/api/chat.js)) e a resposta da IA vai aparecendo token a token (efeito de "digitando"). Durante essa tela, o **guarda de aba** fica ativo (ver seção abaixo).

   **Cronômetro:** o relógio começa (`iniciarCronometro()`, uma única vez por partida) quando a **primeira mensagem da IA começa a aparecer**, não quando a equipe é escolhida. Ele fica visível, discreto, ao lado de "ONLINE AGORA" no cabeçalho do chat ([Cronometro.jsx](frontend/src/components/Cronometro.jsx)) e é calculado a partir do horário salvo, então continua certo se a página for recarregada.

5. Quando a IA detecta que **todos os enigmas foram resolvidos**, ela inclui um marcador técnico invisível na resposta final. O backend detecta esse marcador no meio do streaming e avisa o frontend via evento `{"type":"done","completed":true}`. O frontend então:
   - marca `finishedAt` (`finish()`), que **para o cronômetro** no instante em que a IA confirma a vitória;
   - troca o campo de digitar pelo botão **CONCLUIR ENIGMA** (não há redirecionamento automático);
   - ao clicar no botão, navega para **`/resultado` — [Resultado.jsx](frontend/src/pages/Resultado.jsx)**, que mostra o tempo total em `mm:ss` e um botão **REINICIAR**. A tela de resultado só abre depois que o enigma foi concluído (abrir `/resultado` pela URL no meio do jogo volta para o chat).

6. Se o aluno sair da aba/minimizar por tempo demais, é redirecionado para **`/desclassificado` — [Desclassificado.jsx](frontend/src/pages/Desclassificado.jsx)**. Enquanto a equipe estiver desclassificada, **todas as outras rotas ficam bloqueadas** (pela URL ou pelo botão voltar do navegador, ver `Protegida` em [App.jsx](frontend/src/App.jsx)); o único caminho é o botão **REINICIAR**, que apaga ano, equipe, sessão, mensagens e cronômetro e volta para a seleção de ano. O mesmo `REINICIAR` existe na tela de resultado. Nada é reiniciado automaticamente. O histórico salvo no banco do backend não é apagado (fica como auditoria; uma nova partida gera um novo `session_id`).

---

## Como funciona o chat com a IA

O núcleo está em [`backend/app/chat.py`](backend/app/chat.py) e [`backend/app/prompts/__init__.py`](backend/app/prompts/__init__.py):

- Cada turma tem seu próprio arquivo de prompt em `backend/app/prompts/*.md` (identidade da IA, tom de voz, lista de enigmas sequenciais, mensagem de boas-vindas, mensagem de vitória).
- Ao carregar cada prompt, o backend **acrescenta automaticamente um rodapé técnico** (`_FOOTER_TEMPLATE`) instruindo o modelo a, e somente quando o jogo for vencido, iniciar a mensagem final com um marcador invisível: `[[JOGO_CONCLUIDO]]`. O prompt instrui explicitamente a IA a nunca revelar esse marcador ao aluno.
- O endpoint `POST /api/chat` (em [`main.py`](backend/app/main.py)) recebe `{session_id, turma, history, message}` e devolve uma resposta em **streaming NDJSON** (`application/x-ndjson`, uma linha JSON por evento):
  - `{"type": "token", "text": "..."}` — pedaço de texto da resposta;
  - `{"type": "done", "completed": true|false}` — fim da resposta; `completed=true` significa que o marcador de vitória foi detectado;
  - `{"type": "error", "message": "..."}` — erro (turma inválida, mensagem vazia, falha na OpenAI, etc.).
- `stream_chat_response()` procura o marcador `[[JOGO_CONCLUIDO]]` **em qualquer posição** do texto (a IA nem sempre o coloca no começo) e **mesmo que ele chegue picado em vários pedacinhos** do streaming da OpenAI (a API não garante o tamanho de cada chunk): ela segura no buffer só as últimas letras que ainda podem ser começo do marcador e libera o resto. O marcador nunca é enviado ao frontend — só o texto de "parabéns".
- Cada mensagem (do aluno e da IA) é salva no SQLite via [`db.py`](backend/app/db.py), associada ao `session_id` e à `turma` — isso serve só como histórico/auditoria, não é usado para autenticação.
- O frontend nunca reenvia o `system_prompt`: ele manda só o histórico (`history`) de mensagens visíveis, e o backend remonta o prompt de sistema a cada chamada.

---

## Guarda de aba (anti-cola)

Implementado em [`frontend/src/hooks/useTabGuard.js`](frontend/src/hooks/useTabGuard.js) e usado só na tela de chat:

- A cada 400ms, verifica se a aba está oculta ou sem foco (`document.hidden` / `!document.hasFocus()`).
- Se o aluno ficar fora da aba por **mais de 10 segundos seguidos**, a equipe é automaticamente desclassificada (`onDisqualify()` → navega para `/desclassificado`).
- Se voltar antes disso, um aviso ("VOCÊ VOLTOU, faltavam Xs") fica preso na tela até o aluno clicar em "VOLTAR AO DESAFIO" — não some sozinho, para evitar que a pessoa ignore o aviso.
- Também tenta bloquear o fechamento/recarregamento da aba (`beforeunload`), embora os navegadores modernos sempre mostrem o próprio diálogo genérico nesse caso.

---

## Persistência de estado no navegador

Toda a store do jogo ([`frontend/src/store/useAppStore.js`](frontend/src/store/useAppStore.js)) usa **Zustand com `persist`**, salvando em `localStorage` sob a chave `ai-mistery-storage`. Isso inclui: ano escolhido, equipe, `sessionId`, horários de início/fim, mensagens do chat e status de desclassificação.

Consequência prática: **recarregar a página no meio de uma partida não reinicia o jogo** — o aluno volta exatamente de onde parou. A única forma de zerar de verdade é clicar em "REINICIAR" (chama `reset()`) nas telas de resultado/desclassificado, ou limpar o `localStorage` do navegador manualmente.

---

## Como rodar o projeto

Pré-requisitos: **Python 3.11+** e **Node.js 20+** instalados.

### Início rápido (Windows): 1 clique

Na pasta do projeto:

- **`iniciar.bat`** (duplo clique) sobe tudo: backend + frontend, e abre o navegador em `http://localhost:5173`. Nenhum comando para digitar.
- **`parar.bat`** (duplo clique) derruba tudo (ou feche as duas janelas minimizadas "AI Mistery - Backend/Frontend").

O que o `iniciar.bat` faz sozinho: fecha execuções antigas (libera as portas 8000 e 5173), cria o ambiente Python e instala as dependências na primeira vez (ou se a pasta foi copiada para outro computador), instala o `node_modules` se faltar, cria os `.env` a partir dos exemplos (e abre o Bloco de Notas se a `OPENAI_API_KEY` ainda for a de exemplo), espera o sistema responder e abre o navegador. Leva ~10 s nas execuções seguintes; a primeira precisa de internet para baixar as dependências.

O backend sobe **sem `--reload`**: para aplicar uma edição em um prompt (`.md`) ou em código do backend, rode o `iniciar.bat` de novo (ele reinicia tudo).

Se preferir subir na mão, siga os passos abaixo (PowerShell, a partir da raiz do repositório).

### 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Abra o `backend\.env` recém-criado e preencha `OPENAI_API_KEY` com uma chave válida da OpenAI. Depois suba o servidor:

```powershell
uvicorn app.main:app --reload --port 8000
```

- A API sobe em `http://localhost:8000`.
- `GET http://localhost:8000/api/health` deve responder `{"status":"ok","turmas":[...]}` se estiver tudo certo.
- Na primeira execução, o SQLite (`backend/data/conversations.db`) é criado automaticamente.

### 2. Frontend

Em outro terminal:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

- Abre em `http://localhost:5173` (padrão do Vite).
- O `frontend\.env` já vem apontando para `VITE_API_URL=http://localhost:8000`, que é o padrão do backend local — normalmente não precisa mudar nada aqui em desenvolvimento.

Com os dois servidores rodando, acesse `http://localhost:5173` no navegador e o jogo estará funcional de ponta a ponta.

---

## Variáveis de ambiente

### `backend/.env` (a partir de [`backend/.env.example`](backend/.env.example))

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `OPENAI_API_KEY` | **sim** | — | Chave da API da OpenAI. Sem ela, todo request ao chat falha. |
| `OPENAI_MODEL` | não | `gpt-4o-mini` | Modelo usado para gerar as respostas dos enigmas. |
| `CORS_ORIGINS` | não | `http://localhost:5173` | Origens do frontend autorizadas a chamar a API (separadas por vírgula). |

### `frontend/.env` (a partir de [`frontend/.env.example`](frontend/.env.example))

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `VITE_API_URL` | não | `http://localhost:8000` | URL base do backend que o frontend vai chamar. |

> Nenhum dos dois `.env` é versionado (estão nos respectivos `.gitignore`). Sempre parta do `.env.example` correspondente.

---

## Como editar os enigmas de cada turma

Cada arquivo em `backend/app/prompts/*.md` é o **prompt de sistema completo** daquela turma — é só texto/markdown, sem código. Para trocar os enigmas, a mensagem de boas-vindas, o tom de voz ou a mensagem de vitória de uma turma, basta editar o `.md` correspondente (veja o mapa em [`backend/app/prompts/__init__.py`](backend/app/prompts/__init__.py) → `TURMA_FILES`):

- `fundamental1_4.md` → 4º ano
- `fundamental1_5.md` → 5º ano
- `fundamental2_67.md` → 6º ao 7º ano
- `fundamental2_89.md` → 8º ao 9º ano
- `medio_regular.md` → Ensino Médio Regular
- `medio_tecnico.md` → Ensino Médio Técnico

**Não precisa reescrever nem tocar no rodapé técnico** (`REGRA TÉCNICA OBRIGATÓRIA` / marcador `[[JOGO_CONCLUIDO]]`) — ele é injetado automaticamente pelo código em todos os prompts. Basta garantir que a "mensagem final de vitória" descrita no seu prompt seja clara o bastante para a IA saber exatamente quando o jogo terminou.

Depois de editar um `.md`, **reinicie o backend** (rode `iniciar.bat` de novo) para a mudança ter efeito — os prompts são carregados uma vez na inicialização (`PROMPTS` em `prompts/__init__.py`) e o `--reload` do uvicorn **não** observa arquivos `.md`.

**Palavras-chave de dica:** em todos os prompts, se a mensagem do aluno contiver `rock` ou `future`, a IA dá uma dica sutil **do enigma em que o aluno está agora** (o último apresentado e ainda não resolvido), seja o 1, 2, 3 ou 4 — não existe mais palavra "do enigma 1" ou "do enigma 2". A regra está nos blocos `REGRA DE DICAS` e `EASTER EGGS` de cada `.md`; para trocar as palavras, altere os dois blocos em todos os arquivos. Observação: o modelo nem sempre obedece à parte "sem a palavra-chave, não dar dica" (um aluno que pede dica sem a palavra pode ser atendido).

Para adicionar uma turma nova: crie o `.md` e adicione uma entrada em `TURMA_FILES`, depois adicione o card correspondente em [`frontend/src/data/anos.js`](frontend/src/data/anos.js) (o campo `turmaKey` precisa bater com a chave usada em `TURMA_FILES`).

---

## Erros comuns e como resolver

| Sintoma | Causa provável | Solução |
|---|---|---|
| Tela de chat trava em "digitando" para sempre / balão de erro "Não consegui falar com o servidor" | Backend não está rodando, ou está em outra porta | Confirme que `uvicorn` está de pé em `http://localhost:8000` e que `VITE_API_URL` no `frontend/.env` aponta para lá |
| Erro de CORS no console do navegador | A origem do frontend não está em `CORS_ORIGINS` no `backend/.env` | Adicione a URL do frontend (ex: `http://localhost:5173`) em `CORS_ORIGINS`, separando por vírgula se houver mais de uma, e reinicie o backend |
| Mensagem "Falha ao falar com a OpenAI" / "Ops, Falha ao falar com a OpenAI: ..." no chat | `OPENAI_API_KEY` ausente, inválida, sem créditos, ou `OPENAI_MODEL` incorreto/sem acesso | Confira a chave em `backend/.env`, teste se ela é válida, confirme que a conta tem créditos e acesso ao modelo configurado |
| `ModuleNotFoundError` ao rodar `uvicorn` | Ambiente virtual não ativado ou dependências não instaladas | Ative o venv (`.venv\Scripts\Activate.ps1`) e rode `pip install -r requirements.txt` novamente |
| `uvicorn: comando não encontrado` | Ambiente virtual não ativado | Ative o venv antes de rodar o comando, ou use `python -m uvicorn app.main:app --reload` |
| Porta 8000 ou 5173 já em uso | Outro processo já está usando a porta (ex: uma instância anterior do servidor) | Encerre o processo antigo, ou rode com outra porta (`--port 8001` no backend; no frontend, o Vite pergunta e sugere outra porta automaticamente) |
| `iniciar.bat` diz que Python/Node não foi encontrado | Python ou Node.js não instalado (ou fora do PATH) | Instale o Python 3 (marque "Add python.exe to PATH") e o Node.js LTS, feche e abra o `iniciar.bat` de novo |
| A IA responde com enigmas/textos antigos depois de editar um prompt | O backend ainda está com o prompt antigo em memória | Rode `iniciar.bat` de novo (ele reinicia o backend) |
| Progresso do jogo "preso" numa tela errada ao recarregar | Estado antigo salvo no `localStorage` (`ai-mistery-storage`) | Clique em "REINICIAR" na tela de resultado/desclassificado, ou limpe o `localStorage` do site nas ferramentas de desenvolvedor do navegador |
| A IA nunca marca o jogo como vencido (não navega para `/resultado`) | O prompt `.md` da turma não descreve claramente a "mensagem final de vitória" que o modelo deve emitir quando os enigmas acabam | Revise o `.md` da turma — a regra técnica só funciona se o prompt deixar claro quando o jogo terminou de verdade |
| Banco `conversations.db` corrompido ou com dados de teste indesejados | Testes locais anteriores | Pare o backend, apague `backend/data/conversations.db*` (será recriado do zero na próxima subida) — **isso apaga todo o histórico de conversas salvo** |
| Erro de import do `python-dotenv` ou variáveis do `.env` não carregam | `.env` não existe ainda (só o `.env.example`) | Copie `backend/.env.example` para `backend/.env` (e o mesmo para o frontend) antes de rodar |

---

## Banco de dados

O backend usa **SQLite** (via `aiosqlite`) só para guardar um histórico bruto das conversas, em `backend/data/conversations.db`. Uma única tabela:

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,   -- UUID gerado no frontend ao escolher a equipe
    turma TEXT NOT NULL,        -- ex: "fundamental1_4", "medio_tecnico"
    role TEXT NOT NULL,         -- "user" ou "assistant"
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Não há nenhuma rota de leitura desse histórico exposta pela API — é só para inspeção manual/auditoria (ex: abrindo o `.db` com o DB Browser for SQLite ou `sqlite3` via linha de comando). O arquivo é criado automaticamente na primeira subida do backend e **não é versionado** no Git.

---

## Scripts úteis

**Backend** (dentro de `backend/`, com o venv ativado):

```powershell
uvicorn app.main:app --reload --port 8000   # sobe a API em modo desenvolvimento
```

**Frontend** (dentro de `frontend/`):

```powershell
npm run dev       # sobe o servidor de desenvolvimento (Vite)
npm run build     # gera o build de produção em frontend/dist
npm run preview   # serve localmente o build de produção, para testar antes de publicar
npm run lint      # roda o oxlint sobre o código do frontend
```
