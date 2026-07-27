"""
Assistant Response data model for ARIA.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class AssistantResponse:
    """
    Standardized response object from ARIA core / assistant capabilities.
    """
    content: str
    response_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    model: str = "placeholder-echo"
    finish_reason: str = "stop"
    usage: Dict[str, int] = field(default_factory=dict)
    timestamp: str = field(default_factory=get_utc_now_iso)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "response_id": self.response_id,
            "session_id": self.session_id,
            "content": self.content,
            "model": self.model,
            "finish_reason": self.finish_reason,
            "usage": self.usage,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AssistantResponse":
        return cls(
            response_id=data.get("response_id", str(uuid.uuid4())),
            session_id=data.get("session_id", str(uuid.uuid4())),
            content=data.get("content", ""),
            model=data.get("model", "placeholder-echo"),
            finish_reason=data.get("finish_reason", "stop"),
            usage=data.get("usage", {}),
            timestamp=data.get("timestamp", get_utc_now_iso()),
            metadata=data.get("metadata", {}),
        )
