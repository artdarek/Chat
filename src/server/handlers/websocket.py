import json
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect

from server.connection import manager


async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    # Send initial welcome with your id and current users
    await websocket.send_json({
        "type": "welcome",
        "you": manager.user_id(websocket),
        "users": manager.users(),
    })
    # Notify all clients of current users list
    await manager.broadcast_json({"type": "users", "users": manager.users()})
    try:
        while True:
            data = await websocket.receive_text()
            # Try to parse as a control message
            try:
                obj = json.loads(data)
            except Exception:
                obj = None

            if isinstance(obj, dict) and obj.get("type") == "set_name":
                name = str(obj.get("name", "")).strip()
                if name:
                    manager.set_name(websocket, name)
                    await manager.broadcast_json({"type": "users", "users": manager.users()})
                continue

            # Otherwise treat as normal chat text
            await manager.broadcast_json({
                "type": "message",
                "from": manager.user_id(websocket),
                "from_name": manager.user_name(websocket),
                "text": str(data),
                "ts": datetime.now(timezone.utc).isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        # Broadcast updated users list on disconnect
        await manager.broadcast_json({"type": "users", "users": manager.users()})
