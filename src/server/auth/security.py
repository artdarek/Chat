import base64
import hashlib
import hmac
import os
from typing import Tuple


ALGO = "sha256"
ITERATIONS = 260_000
SALT_LEN = 16


def _pbkdf2(password: str, salt: bytes, iterations: int = ITERATIONS, algo: str = ALGO) -> bytes:
    return hashlib.pbkdf2_hmac(algo, password.encode("utf-8"), salt, iterations)


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("ascii").rstrip("=")


def _b64d(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def hash_password(password: str) -> str:
    salt = os.urandom(SALT_LEN)
    dk = _pbkdf2(password, salt)
    return f"pbkdf2_{ALGO}${ITERATIONS}${_b64e(salt)}${_b64e(dk)}"


def _parse(encoded: str) -> Tuple[str, int, bytes, bytes]:
    try:
        scheme, iter_s, salt_s, hash_s = encoded.split("$")
        algo = scheme.split("_", 1)[1]
        iterations = int(iter_s)
        salt = _b64d(salt_s)
        digest = _b64d(hash_s)
        return algo, iterations, salt, digest
    except Exception as e:
        raise ValueError("invalid password hash format") from e


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algo, iterations, salt, digest = _parse(password_hash)
        calc = hashlib.pbkdf2_hmac(algo, password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(calc, digest)
    except Exception:
        return False
