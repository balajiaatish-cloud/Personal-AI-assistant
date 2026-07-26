"""
Message data model for ARIA.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from aria.llm.base import LLMMessage


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Message:
    """
    Standardized Message model across ARIA subsystems.
    """
    role: str  # "system", "user", "assistant", "tool"
    content: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=get_utc_now_iso)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Message":
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            session_id=data.get("session_id", str(uuid.uuid4())),
            role=data.get("role", "user"),
            content=data.get("content", ""),
            timestamp=data.get("timestamp", get_utc_now_iso()),
            metadata=data.get("metadata", {}),
        )

    def to_llm_message(self) -> LLMMessage:
        return LLMMessage(
            role=self.role,
            content=self.content,
            metadata={**self.metadata, "id": self.id, "session_id": self.session_id},
        )
