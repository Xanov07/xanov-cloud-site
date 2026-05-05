import os
from contextlib import asynccontextmanager

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_session_history, init_db, log_analytics, save_message
from telegram_notify import send_telegram

load_dotenv()

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
TELEGRAM_TOKEN = os.environ["TELEGRAM_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

MODEL = "claude-haiku-4-5"

SYSTEM_PROMPT = """Ты — AI-ассистент компании XanovCompany. Отвечаешь ТОЛЬКО на вопросы про:
- AI-агентов (виртуальный продажник, аналитик данных, агент в соцсетях)
- Готовые решения (новостной канал-бот, вирусный контент бот, AI email-ассистент, бот аналитики продаж, лид-менеджер, воронка продаж в Telegram)
- Автоматизацию бизнеса
- Цены и сроки

На вопросы не по теме отвечай: "Я помогаю только с автоматизацией бизнеса. Задайте вопрос про AI-агентов или готовые решения."

Правила:
- Отвечай кратко и по делу, 1-3 предложения максимум
- Не предлагай купить первым — только если клиент спрашивает
- Если клиент пишет "хочу заказать" — скажи "Передаю заявку менеджеру, вам напишут в Telegram в течение часа."

Информация о продуктах:
AI-агенты (разработка с нуля):
- Виртуальный продажник: от $500. Отвечает на вопросы, снимает возражения, ведёт к оплате 24/7
- Аналитик данных: от $650. Собирает показатели, строит отчёты, сигнализирует об отклонениях
- Агент в соцсетях: от $800. Находит клиентов, начинает диалог, закрывает на сделку

Готовые решения (настройка за 1-3 дня):
- Новостной канал-бот: от $30
- Вирусный контент бот: от $50
- AI Email-ассистент: от $50
- Бот аналитики продаж: от $60
- Лид-менеджер: от $60
- Воронка продаж в Telegram: от $75

Апгрейды к агентам: настройка сценариев +$100, обучение на данных +$150, интеграция с базой +$120, поддержка $50/мес (1й месяц бесплатно при покупке)."""


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="XanovCompany Chat API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://xanov.cloud",
        "https://www.xanov.cloud",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

claude = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    session_id: str
    message: str
    username: str | None = None


class ChatResponse(BaseModel):
    reply: str
    order_mode: bool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Load conversation history (creates session if needed)
    history = await get_session_history(req.session_id)

    # Append the new user message
    history.append({"role": "user", "content": req.message})

    # Call Claude
    response = await claude.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=history,
    )

    reply_text = response.content[0].text if response.content else ""

    # Persist both turns
    await save_message(req.session_id, "user", req.message)
    await save_message(req.session_id, "assistant", reply_text)

    # Log to analytics
    await log_analytics(req.session_id, req.message, reply_text)

    # Detect order intent (case-insensitive)
    order_mode = "хочу заказать" in req.message.lower()

    if order_mode:
        username_display = req.username or "неизвестен"
        tg_text = (
            f"🛒 *Новая заявка!*\n\n"
            f"👤 Пользователь: `{username_display}`\n"
            f"🆔 Сессия: `{req.session_id}`\n\n"
            f"💬 Сообщение:\n{req.message}"
        )
        await send_telegram(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, tg_text)

    return ChatResponse(reply=reply_text, order_mode=order_mode)


@app.get("/analytics")
async def analytics():
    """Return the 20 most recent Q&A pairs from the analytics table."""
    import aiosqlite
    from database import DB_PATH

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            SELECT session_id, question, answer, created_at
            FROM analytics
            ORDER BY created_at DESC
            LIMIT 20
            """
        )
        rows = await cursor.fetchall()

    return [
        {
            "session_id": row[0],
            "question": row[1],
            "answer": row[2],
            "created_at": row[3],
        }
        for row in rows
    ]


@app.get("/health")
async def health():
    return {"status": "ok"}
