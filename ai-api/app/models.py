"""Request/response shapes, and the structured output each agent must return."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

MAX_MESSAGE_CHARS = 20_000


# ── what the agents return (enforced by ADK output_schema) ──────────────────
class Filled(BaseModel):
    field: str
    value: str
    reason: str = Field(description="A few words.")


class Dropped(BaseModel):
    field: str
    value: str
    reason: str = Field(description="A few words.")


class Change(BaseModel):
    field: str
    before: str
    after: str
    reason: str = Field(description="A few words naming the rule.")


class TranslateOutput(BaseModel):
    message: str = Field(description="The complete target message.")
    fixed: list[Change] = Field(default_factory=list, description="Only when asked to fix the source: each correction made.")
    filled: list[Filled] = Field(default_factory=list, description="Target fields with no source value.")
    dropped: list[Dropped] = Field(default_factory=list, description="Source values with no place in the target.")
    notes: str = Field(default="", description="One short sentence, or empty.")


class Unresolved(BaseModel):
    issue: str
    reason: str = Field(description="Why only the sender can fix it.")


class RepairOutput(BaseModel):
    message: str = Field(description="The complete repaired message, same format.")
    changes: list[Change] = Field(default_factory=list)
    unresolved: list[Unresolved] = Field(default_factory=list)
    summary: str = Field(default="", description="One short sentence.")


class TranslateRequest(BaseModel):
    source: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    target: str = Field(min_length=2, max_length=32)
    sourceType: Optional[str] = Field(default=None, max_length=32)
    fix: bool = Field(default=False, description="Correct the source's validation errors while translating (one AI call).")


class RepairRequest(BaseModel):
    source: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    sourceType: Optional[str] = Field(default=None, max_length=32)
    rejectReason: Optional[str] = Field(default=None, max_length=200, description="Optional reject reason code or text, e.g. 'AC01'.")
