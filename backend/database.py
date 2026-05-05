import aiosqlite
from datetime import datetime

DB_PATH = "chat.db"


async def init_db() -> None:
    """Initialize the database and create tables if they don't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id          TEXT PRIMARY KEY,
                created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL REFERENCES sessions(id),
                role       TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content    TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)"
        )

        await db.execute("""
            CREATE TABLE IF NOT EXISTS analytics (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                question   TEXT NOT NULL,
                answer     TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.commit()


async def get_session_history(session_id: str) -> list[dict]:
    """
    Return the last 20 messages for a session as a list of {role, content} dicts.
    Creates the session record if it doesn't exist yet.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        # Upsert session so it exists before we query messages
        await db.execute(
            """
            INSERT INTO sessions (id, created_at, last_active)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET last_active = excluded.last_active
            """,
            (session_id, datetime.utcnow(), datetime.utcnow()),
        )
        await db.commit()

        cursor = await db.execute(
            """
            SELECT role, content
            FROM (
                SELECT role, content, created_at
                FROM messages
                WHERE session_id = ?
                ORDER BY created_at DESC
                LIMIT 20
            )
            ORDER BY created_at ASC
            """,
            (session_id,),
        )
        rows = await cursor.fetchall()

    return [{"role": row[0], "content": row[1]} for row in rows]


async def save_message(session_id: str, role: str, content: str) -> None:
    """Persist a single message and update the session's last_active timestamp."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, role, content),
        )
        await db.execute(
            "UPDATE sessions SET last_active = ? WHERE id = ?",
            (datetime.utcnow(), session_id),
        )
        await db.commit()


async def log_analytics(session_id: str, question: str, answer: str) -> None:
    """Log a Q&A pair to the analytics table for FAQ tracking."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO analytics (session_id, question, answer) VALUES (?, ?, ?)",
            (session_id, question, answer),
        )
        await db.commit()
