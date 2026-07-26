"""
Google Gemini LLM Provider stub.
"""

import logging
from typing import Any, Dict, Iterator, List, Optional
from aria.llm.base import BaseLLMProvider, LLMMessage, LLMResponse
from aria.llm.exceptions import ProviderInitializationError
from aria.utils.logger import get_logger


class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini LLM Provider implementation stub.
    """

    def __init__(self, model_name: str = "gemini-1.5-flash", config: Optional[Dict[str, Any]] = None):
        super().__init__(model_name=model_name, config=config)
        self.logger = get_logger("aria.llm.gemini")
        self.api_key = self.config.get("api_key") or ""

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def supports_streaming(self) -> bool:
        return True

    @property
    def supports_tools(self) -> bool:
        return True

    @property
    def max_context_window(self) -> int:
        return 1048576

    def generate(self, messages: List[LLMMessage], **kwargs: Any) -> LLMResponse:
        self.logger.info(f"Gemini generate stub called for model: {self.model_name}")
        last_message = messages[-1].content if messages else ""
        content = f"[Gemini Stub Response] Gemini received: {last_message}"
        return LLMResponse(
            content=content,
            model=self.model_name,
            finish_reason="stop",
            usage={"prompt_tokens": len(last_message.split()), "completion_tokens": len(content.split())},
            metadata={"provider": self.provider_name}
        )

    def stream(self, messages: List[LLMMessage], **kwargs: Any) -> Iterator[str]:
        response = self.generate(messages, **kwargs)
        for char in response.content:
            yield char
