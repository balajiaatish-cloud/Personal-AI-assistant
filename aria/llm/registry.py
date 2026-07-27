"""
Provider registry and factory for ARIA LLM providers.
"""

from typing import Dict, Type, List, Optional, Any
from aria.llm.base import BaseLLMProvider
from aria.llm.providers.mock import MockProvider
from aria.llm.providers.openai import OpenAIProvider
from aria.llm.providers.ollama import OllamaProvider
from aria.llm.providers.gemini import GeminiProvider
from aria.llm.exceptions import ProviderInitializationError


class LLMProviderRegistry:
    """
    Registry for registering and creating LLM Providers.
    """

    _registry: Dict[str, Type[BaseLLMProvider]] = {
        "mock": MockProvider,
        "openai": OpenAIProvider,
        "ollama": OllamaProvider,
        "gemini": GeminiProvider
    }

    @classmethod
    def register_provider(cls, name: str, provider_cls: Type[BaseLLMProvider]) -> None:
        """
        Register a new LLM provider type.
        """
        cls._registry[name.lower()] = provider_cls

    @classmethod
    def get_provider_class(cls, name: str) -> Type[BaseLLMProvider]:
        """
        Get the class associated with a provider name.
        """
        key = name.lower()
        if key not in cls._registry:
            raise ProviderInitializationError(
                f"LLM Provider '{name}' is not registered. Registered providers: {list(cls._registry.keys())}",
                provider_name=name
            )
        return cls._registry[key]

    @classmethod
    def create(
        cls,
        provider_name: str,
        model_name: str,
        config: Optional[Dict[str, Any]] = None
    ) -> BaseLLMProvider:
        """
        Instantiate an LLM provider of the given type and configuration.
        """
        provider_cls = cls.get_provider_class(provider_name)
        try:
            return provider_cls(model_name=model_name, config=config)
        except Exception as e:
            if isinstance(e, ProviderInitializationError):
                raise e
            raise ProviderInitializationError(
                f"Failed to instantiate provider '{provider_name}': {e}",
                provider_name=provider_name,
                raw_error=e
            )

    @classmethod
    def get_registered_providers(cls) -> List[str]:
        """
        Return names of all registered providers.
        """
        return list(cls._registry.keys())
