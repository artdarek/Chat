from fastapi import APIRouter, Cookie, HTTPException, Response, status

from server.auth import db
from server.auth.schemas import Login, Me, Signup
from server.auth.security import hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Me)
def signup(payload: Signup):
    if not payload.email and not payload.username:
        raise HTTPException(status_code=400, detail="username or email is required")
    # Ensure uniqueness
    if payload.username and db.get_user_by_login(payload.username):
        raise HTTPException(status_code=409, detail="username already exists")
    if payload.email and db.get_user_by_login(payload.email):
        raise HTTPException(status_code=409, detail="email already exists")
    user = db.create_user(
        email=str(payload.email) if payload.email else None,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    return Me(id=user.id, email=user.email, username=user.username)


@router.post("/login", response_model=Me)
def login(payload: Login, response: Response):
    row = db.get_user_by_login(payload.login)
    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    token = db.create_session(row["id"])
    # HttpOnly cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7,
    )
    return Me(id=row["id"], email=row["email"], username=row["username"])


@router.post("/logout")
def logout(response: Response, session_token: str | None = Cookie(default=None)):
    if session_token:
        db.delete_session(session_token)
        response.delete_cookie("session_token", path="/")
    return {"ok": True}


@router.get("/me", response_model=Me | dict)
def me(session_token: str | None = Cookie(default=None)):
    if not session_token:
        return {"user": None}
    user = db.get_user_by_token(session_token)
    if not user:
        return {"user": None}
    return Me(id=user.id, email=user.email, username=user.username)

