from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class HistoryMessage(BaseModel):
    role: Role
    content: str


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=100)
    turma: str
    history: list[HistoryMessage] = Field(default_factory=list)
    message: str = ""
