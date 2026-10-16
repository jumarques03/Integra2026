import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Palavra-passe que libera o Enigma 5. Só o backend conhece: ela não vai no
# prompt (a IA não sabe qual é) nem para o frontend. A mensagem do aluno
# precisa ser exatamente essa (sem diferenciar maiúsculas/minúsculas).
PALAVRA_PASSE = (os.getenv("PALAVRA_PASSE") or "hands on").strip()

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

DB_PATH = BASE_DIR / "data" / "conversations.db"
