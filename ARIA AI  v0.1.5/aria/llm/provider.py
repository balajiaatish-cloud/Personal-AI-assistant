"""
LLM Provider implementations and factory registry.
"""

import logging
from typing import Any, Dict, Iterator, List, Optional, Type
from aria.llm.base import BaseLLMProvider, LLMMessage, LLMResponse
from aria.utils.logger import get_logger


class MockLLMProvider(BaseLLMProvider):
    """
    Mock LLM Provider for offline testing, local debugging, and fallback scenarios.
    """

    def __init__(
        self,
        model_name: str = "mock-gpt",
        config: Optional[Dict[str, Any]] = None,
        default_reply: Optional[str] = None
    ):
        super().__init__(model_name=model_name, config=config)
        self.default_reply = default_reply or "This is an automated response from the ARIA Mock LLM Provider."
        self.logger: logging.Logger = get_logger("aria.llm.mock")

    @property
    def provider_name(self) -> str:
        return "mock"

    def generate(self, messages: List[LLMMessage], **kwargs: Any) -> LLMResponse:
        self.logger.debug(f"MockLLMProvider generating response for {len(messages)} messages.")
        last_message = messages[-1].content if messages else ""
        reply = kwargs.get("reply_text") or self.default_reply
        if "echo:" in last_message.lower():
            reply = f"Echo: {last_message}"

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


class GenericAPILLMProvider(BaseLLMProvider):
    """
    Generic HTTP / API LLM Provider stub for cloud endpoint integrations (OpenAI, Anthropic, Ollama, etc.).
    """

    def __init__(
        self,
        model_name: str = "gpt-4o",
        config: Optional[Dict[str, Any]] = None,
        provider_identifier: str = "generic_api"
    ):
        super().__init__(model_name=model_name, config=config)
        self._provider_name = provider_identifier
        self.api_key = self.config.get("api_key")
        self.api_base = self.config.get("api_base", "https://api.openai.com/v1")
        self.logger: logging.Logger = get_logger("aria.llm.generic")

    @property
    def provider_name(self) -> str:
        return self._provider_name

    def generate(self, messages: List[LLMMessage], **kwargs: Any) -> LLMResponse:
        self.logger.info(f"Generating via {self.provider_name} ({self.model_name})")
        # Base API invocation placeholder
        if not self.api_key:
            self.logger.warning(f"No API key provided for {self.provider_name}. Falling back to simulation output.")

        last_message = messages[-1].content if messages else ""
        response_text = f"[{self.provider_name}:{self.model_name}] Received: {last_message}"

        return LLMResponse(
            content=response_text,
            model=self.model_name,
            finish_reason="stop",
            usage={"prompt_tokens": len(last_message), "completion_tokens": len(response_text)},
            metadata={"api_base": self.api_base, "provider": self.provider_name}
        )

    def stream(self, messages: List[LLMMessage], **kwargs: Any) -> Iterator[str]:
        response = self.generate(messages, **kwargs)
        for char in response.content:
            yield char


class LLMProviderFactory:
    """
    Factory for registering and creating LLM Providers.
    """

    _registry: Dict[str, Type[BaseLLMProvider]] = {
        "mock": MockLLMProvider,
        "generic": GenericAPILLMProvider,
        "openai": GenericAPILLMProvider,
        "anthropic": GenericAPILLMProvider
    }

    @classmethod
    def register_provider(cls, name: str, provider_cls: Type[BaseLLMProvider]) -> None:
        """
        Register a custom LLM provider class under a key name.
        """
        cls._registry[name.lower()] = provider_cls

    @classmethod
    def create(
        cls,
        provider_name: str = "mock",
        model_name: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        **kwargs: Any
    ) -> BaseLLMProvider:
        """
        Instantiate an LLM provider based on provider_name.
        """
        key = provider_name.lower()
        if key not in cls._registry:
            raise ValueError(f"Unknown LLM provider '{provider_name}'. Available providers: {list(cls._registry.keys())}")

        provider_cls = cls._registry[key]
        default_model = "mock-gpt" if key == "mock" else "default-model"
        target_model = model_name or default_model

        if issubclass(provider_cls, GenericAPILLMProvider) and key in ["openai", "anthropic"]:
            return provider_cls(model_name=target_model, config=config, provider_identifier=key, **kwargs)

        return provider_cls(model_name=target_model, config=config, **kwargs)


def get_provider(
    provider_name: str = "mock",
    model_name: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
    **kwargs: Any
) -> BaseLLMProvider:
    """
    Convenience function to get an instantiated LLM provider.
    """
    return LLMProviderFactory.create(provider_name=provider_name, model_name=model_name, config=config, **kwargs)
