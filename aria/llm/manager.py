"""
Manager responsible for selecting, initializing, and caching LLM providers dynamically.
"""

import logging
from typing import Optional, Dict, Any, List
from aria.config.settings import Settings
from aria.llm.base import BaseLLMProvider, LLMMessage, LLMResponse
from aria.llm.registry import LLMProviderRegistry
from aria.utils.logger import get_logger


class LLMManager:
    """
    LLMManager handles active provider selection, lifecycle, and caching.
    Conforms to SOLID principles by decoupling core conversation manager from concrete provider configurations.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = get_logger("aria.llm.manager")
        self._provider_cache: Dict[str, BaseLLMProvider] = {}
        self._active_provider_name = settings.llm.provider
        self._active_model_name = settings.llm.model

    def get_provider(self, provider_name: Optional[str] = None, model_name: Optional[str] = None) -> BaseLLMProvider:
        """
        Retrieve and cache the requested (or currently active) provider instance.
        """
        target_provider = (provider_name or self._active_provider_name).lower()
        target_model = model_name or self._active_model_name

        cache_key = f"{target_provider}:{target_model}"
        if cache_key not in self._provider_cache:
            self.logger.info(f"Initializing and caching LLM provider: '{target_provider}' with model: '{target_model}'")
            config = {
                "api_key": self.settings.llm.api_key,
                "api_base": self.settings.llm.api_base,
            }
            # Instantiate provider via Registry
            provider = LLMProviderRegistry.create(
                provider_name=target_provider,
                model_name=target_model,
                config=config
            )
            self._provider_cache[cache_key] = provider

        return self._provider_cache[cache_key]

    @property
    def active_provider(self) -> BaseLLMProvider:
        """
        Get the currently active provider based on settings.
        """
        return self.get_provider()

    def generate(self, messages: List[LLMMessage], **kwargs: Any) -> LLMResponse:
        """
        Execute completion using active provider.
        """
        return self.active_provider.generate(messages, **kwargs)

    def stream(self, messages: List[LLMMessage], **kwargs: Any):
        """
        Execute stream completion using active provider.
        """
        return self.active_provider.stream(messages, **kwargs)
