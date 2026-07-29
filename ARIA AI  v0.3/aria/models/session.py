"""
Session data model for ARIA.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class SessionModel:
    """
    Data model representing a user interaction session state.
    """
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=get_utc_now_iso)
    last_active_at: str = field(default_factory=get_utc_now_iso)
    is_active: bool = True
    system_prompt: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def touch(self) -> None:
        self.last_active_at = get_utc_now_iso()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "last_active_at": self.last_active_at,
            "is_active": self.is_active,
            "system_prompt": self.system_prompt,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionModel":
        model = cls(
            session_id=data.get("session_id", str(uuid.uuid4())),
            created_at=data.get("created_at", get_utc_now_iso()),
            last_active_at=data.get("last_active_at", get_utc_now_iso()),
            is_active=data.get("is_active", True),
            system_prompt=data.get("system_prompt"),
            metadata=data.get("metadata", {}),
        )
        return model
