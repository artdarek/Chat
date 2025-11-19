from fastapi import APIRouter

from server.handlers import health, send, websocket_endpoint


router = APIRouter()

# HTTP routes
router.add_api_route("/health", health, methods=["GET"])
router.add_api_route("/send", send, methods=["POST"])

# WebSocket route
router.add_api_websocket_route("/ws", websocket_endpoint)
