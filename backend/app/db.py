import aiosqlite

from .config import DB_PATH

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    turma TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)
"""

_CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id)
"""


async def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute(_CREATE_TABLE)
        await db.execute(_CREATE_INDEX)
        await db.commit()


async def save_message(session_id: str, turma: str, role: str, content: str) -> None:
    if not content:
        return
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO messages (session_id, turma, role, content) VALUES (?, ?, ?, ?)",
            (session_id, turma, role, content),
        )
        await db.commit()
