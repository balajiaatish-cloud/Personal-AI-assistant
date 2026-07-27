"""
Compatibility layer forwarding to registry.py and providers.
"""

from aria.llm.registry import LLMProviderRegistry
from aria.llm.providers.mock import MockProvider
from aria.llm.providers.openai import OpenAIProvider

LLMProviderFactory = LLMProviderRegistry
get_provider = LLMProviderRegistry.create

# Legacy Class Aliases
MockLLMProvider = MockProvider
GenericAPILLMProvider = OpenAIProvider
