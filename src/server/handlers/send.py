from datetime import datetime, timezone
from server.schemas import SendMessage
from server.connection import manager


async def send(msg: SendMessage) -> dict:
    await manager.broadcast_json({
        "type": "message",
        "from": msg.user or "server",
        "text": msg.message,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    return {"delivered_to": len(manager.active)}
