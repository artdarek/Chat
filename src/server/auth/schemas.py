import re
from pydantic import BaseModel, Field, field_validator


class Signup(BaseModel):
    email: str | None = None
    username: str | None = Field(None, min_length=3, max_length=30)
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str | None):
        if v is None or v == "":
            return None
        v = v.strip()
        # Lightweight sanity check; avoids email-validator dependency
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("invalid email format")
        return v


class Login(BaseModel):
    login: str
    password: str


class Me(BaseModel):
    id: int
    email: str | None
    username: str | None
