from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

from llm.dummy_llm import DummyLLM

# from llm.gpt_llm import GPTLLM
from fingerprint import create_template, generate_variants, create_signed_token
from config import JWT_SECRET

import jwt

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Swap between LLM implementations
llm = DummyLLM()
# llm = GPTLLM(api_key="sk-...")


class MessageInput(BaseModel):
    message: str
    count: int


@app.post("/generate-fingerprints/")
def generate_fingerprints(input_data: MessageInput):
    message = input_data.message
    paraphrasable_parts = llm.extract_paraphrasable_parts(message)
    template = create_template(message, paraphrasable_parts)
    raw_variants = generate_variants(template, paraphrasable_parts)

    # Embed JWT for each variant
    variants = []
    while len(variants) < input_data.count:
        variant = next(raw_variants)
        token = create_signed_token(
            user=f"user_{len(variants)}", variant_id=len(variants), hash=variant["hash"]
        )
        variants.append(
            {
                "user": f"user_{len(variants)}",
                "token": token,
                "message": variant["message"],
            }
        )

    return {
        "template": template,
        "paraphrasable_parts": paraphrasable_parts,
        "variants": variants,
    }


@app.post("/detect-leak/")
def detect_leak(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "status": "leak confirmed",
            "user": payload["user"],
            "variant_id": payload["variant_id"],
            "hash": payload["hash"],
            "issued_at": payload["iat"],
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=403, detail="Invalid token")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
