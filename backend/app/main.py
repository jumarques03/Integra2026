from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from . import db
from .chat import stream_chat_response
from .config import CORS_ORIGINS
from .prompts import TURMA_FILES
from .schemas import ChatRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    yield


app = FastAPI(title="AI Mistery API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "turmas": list(TURMA_FILES.keys())}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        stream_chat_response(req),
        media_type="application/x-ndjson",
    )
