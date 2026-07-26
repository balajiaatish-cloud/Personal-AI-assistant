"""
Conversation and Message models for managing dialog state in ARIA.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from aria.llm.base import LLMMessage


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Message:
    """
    Represents a single message in a conversation history.
    """
    role: str  # "system", "user", "assistant", "tool"
    content: str
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=get_utc_now_iso)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "message_id": self.message_id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Message":
        return cls(
            message_id=data.get("message_id", str(uuid.uuid4())),
            role=data.get("role", "user"),
            content=data.get("content", ""),
            timestamp=data.get("timestamp", get_utc_now_iso()),
            metadata=data.get("metadata", {}),
        )

    def to_llm_message(self) -> LLMMessage:
        return LLMMessage(
            role=self.role,
            content=self.content,
            metadata=self.metadata,
        )


class Conversation:
    """
    Manages an ordered history of messages, system instructions, and formatting for LLM calls.
    """

    def __init__(
        self,
        conversation_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.conversation_id: str = conversation_id or str(uuid.uuid4())
        self.system_prompt: Optional[str] = system_prompt
        self.created_at: str = get_utc_now_iso()
        self.updated_at: str = self.created_at
        self.messages: List[Message] = []
        self.metadata: Dict[str, Any] = metadata or {}

    def set_system_prompt(self, content: str) -> None:
        """
        Set or update the conversation system prompt.
        """
        self.system_prompt = content
        self.touch()

    def add_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Message:
        """
        Add a generic message to the conversation.
        """
        msg = Message(role=role, content=content, metadata=metadata or {})
        self.messages.append(msg)
        self.touch()
        return msg

    def add_user_message(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> Message:
        """
        Add a user message to the conversation.
        """
        return self.add_message("user", content, metadata)

    def add_assistant_message(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> Message:
        """
        Add an assistant message to the conversation.
        """
        return self.add_message("assistant", content, metadata)

    def get_messages(self, include_system: bool = True) -> List[Message]:
        """
        Return messages list, optionally prepending system prompt if present.
        """
        result: List[Message] = []
        if include_system and self.system_prompt:
            result.append(Message(role="system", content=self.system_prompt))
        result.extend(self.messages)
        return result

    def to_llm_messages(self, include_system: bool = True) -> List[LLMMessage]:
        """
        Convert messages to LLMMessage list ready for provider invocation.
        """
        all_msgs = self.get_messages(include_system=include_system)
        return [msg.to_llm_message() for msg in all_msgs]

    def clear(self) -> None:
        """
        Clear all user/assistant/tool messages in conversation history.
        """
        self.messages.clear()
        self.touch()

    def prune_history(self, max_messages: Optional[int] = None, max_chars: Optional[int] = None) -> None:
        """
        Prune message history to keep within message count or character limits.
        """
        if max_messages is not None and len(self.messages) > max_messages:
            self.messages = self.messages[-max_messages:]

        if max_chars is not None:
            current_chars = sum(len(m.content) for m in self.messages)
            while self.messages and current_chars > max_chars:
                removed = self.messages.pop(0)
                current_chars -= len(removed.content)

        self.touch()

    def touch(self) -> None:
        self.updated_at = get_utc_now_iso()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "conversation_id": self.conversation_id,
            "system_prompt": self.system_prompt,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "messages": [msg.to_dict() for msg in self.messages],
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Conversation":
        conv = cls(
            conversation_id=data.get("conversation_id"),
            system_prompt=data.get("system_prompt"),
            metadata=data.get("metadata", {}),
        )
        if "created_at" in data:
            conv.created_at = data["created_at"]
        if "updated_at" in data:
            conv.updated_at = data["updated_at"]
        conv.messages = [Message.from_dict(m) for m in data.get("messages", [])]
        return conv
