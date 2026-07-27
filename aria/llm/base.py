"""
Base interfaces and data structures for ARIA LLM providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, List, Optional


@dataclass
class LLMMessage:
    """
    Standardized payload structure for messages passed to LLM providers.
    """
    role: str  # "system", "user", "assistant", "tool"
    content: str
    name: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        data = {
            "role": self.role,
            "content": self.content
        }
        if self.name:
            data["name"] = self.name
        if self.metadata:
            data["metadata"] = self.metadata
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LLMMessage":
        return cls(
            role=data.get("role", "user"),
            content=data.get("content", ""),
            name=data.get("name"),
            metadata=data.get("metadata", {})
        )


@dataclass
class LLMResponse:
    """
    Standardized response structure returned by LLM providers.
    """
    content: str
    model: str
    finish_reason: str = "stop"
    usage: Dict[str, int] = field(default_factory=dict)
    raw_response: Optional[Any] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BaseLLMProvider(ABC):
    """
    Abstract Base Class for all LLM providers (e.g. OpenAI, Anthropic, Ollama, Mock).
    """

    def __init__(self, model_name: str, config: Optional[Dict[str, Any]] = None):
        self.model_name = model_name
        self.config = config or {}

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """
        Unique identifier name for the provider.
        """
        pass

    @property
    @abstractmethod
    def supports_streaming(self) -> bool:
        """
        Whether the provider supports token streaming responses.
        """
        pass

    @property
    @abstractmethod
    def supports_tools(self) -> bool:
        """
        Whether the provider supports tool/function calling.
        """
        pass

    @property
    @abstractmethod
    def max_context_window(self) -> int:
        """
        Maximum size of the model context window in tokens.
        """
        pass

    @abstractmethod
    def generate(self, messages: List[LLMMessage], **kwargs: Any) -> LLMResponse:
        """
        Synchronously generate a single completion response for given messages.
        """
        pass

    @abstractmethod
    def stream(self, messages: List[LLMMessage], **kwargs: Any) -> Iterator[str]:
        """
        Stream chunked text responses for given messages.
        """
        pass
