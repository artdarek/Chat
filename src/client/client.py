from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse


router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"


@router.get("/")
async def index() -> FileResponse:
    index_path = TEMPLATES_DIR / "index.html"
    return FileResponse(index_path)
