from typing import Optional

from pydantic import BaseModel


class SendMessage(BaseModel):
    message: str
    user: Optional[str] = None
