from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional


DB_DIR = Path(os.getenv("CHATAPI_DB_DIR", "data"))
DB_PATH = DB_DIR / "chatapi.sqlite3"


def init_db() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as con:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                username TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        con.commit()


@contextmanager
def connect():
    con = sqlite3.connect(DB_PATH)
    try:
        con.row_factory = sqlite3.Row
        yield con
    finally:
        con.close()


@dataclass
class User:
    id: int
    email: Optional[str]
    username: Optional[str]
    created_at: str


def create_user(*, email: Optional[str], username: Optional[str], password_hash: str) -> User:
    now = datetime.now(timezone.utc).isoformat()
    with connect() as con:
        cur = con.execute(
            "INSERT INTO users(email, username, password_hash, created_at) VALUES(?,?,?,?)",
            (email, username, password_hash, now),
        )
        con.commit()
        user_id = cur.lastrowid
        row = con.execute("SELECT id, email, username, created_at FROM users WHERE id=?", (user_id,)).fetchone()
        return User(id=row["id"], email=row["email"], username=row["username"], created_at=row["created_at"])


def get_user_by_login(login: str) -> Optional[sqlite3.Row]:
    with connect() as con:
        return con.execute(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            (login, login),
        ).fetchone()


def create_session(user_id: int, *, ttl_minutes: int = 60 * 24 * 7) -> str:
    from secrets import token_urlsafe

    token = token_urlsafe(32)
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=ttl_minutes)
    with connect() as con:
        con.execute(
            "INSERT INTO sessions(token, user_id, created_at, expires_at) VALUES(?,?,?,?)",
            (token, user_id, now.isoformat(), exp.isoformat()),
        )
        con.commit()
    return token


def delete_session(token: str) -> None:
    with connect() as con:
        con.execute("DELETE FROM sessions WHERE token=?", (token,))
        con.commit()


def get_user_by_token(token: str) -> Optional[User]:
    with connect() as con:
        row = con.execute(
            """
            SELECT u.id, u.email, u.username, u.created_at, s.expires_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()
        if not row:
            return None
        # Check expiry
        try:
            exp = datetime.fromisoformat(row["expires_at"]) if row["expires_at"] else None
            if exp and exp < datetime.now(timezone.utc):
                # Expired: cleanup
                con.execute("DELETE FROM sessions WHERE token=?", (token,))
                con.commit()
                return None
        except Exception:
            pass
        return User(id=row["id"], email=row["email"], username=row["username"], created_at=row["created_at"])

