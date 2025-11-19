from __future__ import annotations

from typing import Any, Dict, Set
import secrets

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Set[WebSocket] = set()
        self.user_ids: Dict[WebSocket, str] = {}
        self.user_names: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.add(websocket)
        uid = f"u-{secrets.token_hex(3)}"  # short, non-identifying id
        self.user_ids[websocket] = uid
        # Default name equals id until set
        self.user_names[websocket] = uid

    def disconnect(self, websocket: WebSocket) -> None:
        self.active.discard(websocket)
        self.user_ids.pop(websocket, None)
        self.user_names.pop(websocket, None)

    def user_id(self, websocket: WebSocket) -> str:
        return self.user_ids.get(websocket, "u-unknown")

    async def broadcast(self, message: str) -> None:
        dead = []
        for ws in list(self.active):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def broadcast_from(self, sender: WebSocket, message: str) -> None:
        prefix = self.user_id(sender)
        await self.broadcast(f"[{prefix}] {message}")

    def set_name(self, websocket: WebSocket, name: str) -> None:
        name = (name or '').strip()
        if not name:
            return
        self.user_names[websocket] = name

    def user_name(self, websocket: WebSocket) -> str:
        return self.user_names.get(websocket, self.user_id(websocket))

    def users(self) -> list[dict[str, str]]:
        # Return list of {id, name}
        items = [{"id": uid, "name": self.user_names.get(ws, uid)} for ws, uid in self.user_ids.items()]
        # sort by name for stable display
        items.sort(key=lambda x: x["name"].lower())
        return items

    async def broadcast_json(self, payload: Any) -> None:
        dead = []
        for ws in list(self.active):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


# Shared instance used by handlers
manager = ConnectionManager()
