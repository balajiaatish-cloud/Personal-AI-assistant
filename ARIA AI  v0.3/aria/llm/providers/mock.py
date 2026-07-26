"""
Mock LLM Provider for offline development and testing.
"""

import logging
from typing import Any, Dict, Iterator, List, Optional
from aria.llm.base import BaseLLMProvider, LLMMessage, LLMResponse
from aria.utils.logger import get_logger


class MockProvider(BaseLLMProvider):
    """
    Mock Provider that outputs predetermined or echoing responses without making network requests.
    """

    def __init__(
        self,
        model_name: str = "mock-model",
        config: Optional[Dict[str, Any]] = None,
        default_reply: Optional[str] = None
    ):
        super().__init__(model_name=model_name, config=config)
        self.default_reply = default_reply
        self.logger = get_logger("aria.llm.mock")

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def supports_streaming(self) -> bool:
        return True

    @property
    def supports_tools(self) -> bool:
        return True

    @property
    def max_context_window(self) -> int:
        return 8192

    def generate(self, messages: List[LLMMessage], **kwargs: Any) -> LLMResponse:
        self.logger.debug("Generating mock LLM response.")
        last_message = messages[-1].content if messages else ""
        
        # If default reply is set (e.g. in tests), return it
        if self.default_reply:
            reply = self.default_reply
        # Exact placeholder requirement: "Echo: <message> — No AI model connected"
        else:
            reply = f"Echo: {last_message} — No AI model connected"

        return LLMResponse(
            content=reply,
            model=self.model_name,
            finish_reason="stop",
            usage={"prompt_tokens": len(last_message.split()), "completion_tokens": len(reply.split())},
            metadata={"provider": self.provider_name}
        )

    def stream(self, messages: List[LLMMessage], **kwargs: Any) -> Iterator[str]:
        response = self.generate(messages, **kwargs)
        words = response.content.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else word + " "
            yield chunk
