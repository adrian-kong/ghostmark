from itertools import product
from typing import Iterator
import hashlib
import jwt
import time
from config import JWT_SECRET


def create_template(message: str, paraphrasable_parts: list) -> str:
    template = message
    for i, part in enumerate(paraphrasable_parts):
        placeholder = f"{{alt_{i}}}"
        template = template.replace(part["original"], placeholder, 1)
    return template


def generate_variants(template: str, paraphrasable_parts: list) -> Iterator[dict]:
    alt_lists = [p["alternatives"] for p in paraphrasable_parts]
    for combo in product(*alt_lists):
        msg = template
        for i, replacement in enumerate(combo):
            msg = msg.replace(f"{{alt_{i}}}", replacement)
        msg_hash = hashlib.sha256(msg.encode()).hexdigest()
        yield {"message": msg, "hash": msg_hash}


def create_signed_token(user: str, variant_id: int, hash: str):
    payload = {
        "user": user,
        "variant_id": variant_id,
        "hash": hash,
        "iat": int(time.time()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")
