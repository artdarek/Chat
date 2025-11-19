from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from client.client import router as client_router


app = FastAPI(title="Chat Client", version="0.1.0")

# Include client routes
app.include_router(client_router)

# Mount static assets
STATIC_DIR = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
