import httpx


async def send_telegram(token: str, chat_id: str, text: str) -> bool:
    """
    Send a message to a Telegram chat via Bot API.

    Args:
        token: Telegram bot token
        chat_id: Target chat ID
        text: Message text (supports Markdown)

    Returns:
        True if message was sent successfully, False otherwise
    """
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return True
    except httpx.HTTPStatusError as e:
        print(f"[Telegram] HTTP error {e.response.status_code}: {e.response.text}")
        return False
    except httpx.RequestError as e:
        print(f"[Telegram] Request error: {e}")
        return False
