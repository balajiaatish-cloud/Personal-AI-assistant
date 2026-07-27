"""
Unit tests for the LLM Provider Registry, exceptions, and Manager.
"""

import unittest
from aria.config.settings import Settings
from aria.llm.base import BaseLLMProvider
from aria.llm.exceptions import ProviderInitializationError
from aria.llm.registry import LLMProviderRegistry
from aria.llm.manager import LLMManager


class DummyCustomProvider(BaseLLMProvider):
    @property
    def provider_name(self) -> str:
        return "dummy_custom"

    @property
    def supports_streaming(self) -> bool:
        return False

    @property
    def supports_tools(self) -> bool:
        return False

    @property
    def max_context_window(self) -> int:
        return 1024

    def generate(self, messages, **kwargs):
        pass

    def stream(self, messages, **kwargs):
        pass


class TestLLMFactoryAndManager(unittest.TestCase):
    def test_registry_registration_and_instantiation(self):
        LLMProviderRegistry.register_provider("dummy_custom", DummyCustomProvider)
        self.assertIn("dummy_custom", LLMProviderRegistry.get_registered_providers())

        provider = LLMProviderRegistry.create("dummy_custom", "model-v1")
        self.assertEqual(provider.provider_name, "dummy_custom")
        self.assertEqual(provider.model_name, "model-v1")
        self.assertFalse(provider.supports_streaming)
        self.assertEqual(provider.max_context_window, 1024)

    def test_registry_unregistered_error(self):
        with self.assertRaises(ProviderInitializationError) as ctx:
            LLMProviderRegistry.create("unregistered_p", "model")
        self.assertIn("is not registered", ctx.exception.message)

    def test_llm_manager_selection(self):
        settings = Settings()
        settings.llm.provider = "mock"
        settings.llm.model = "my-mock-model"

        manager = LLMManager(settings)
        provider = manager.active_provider
        self.assertEqual(provider.provider_name, "mock")
        self.assertEqual(provider.model_name, "my-mock-model")


if __name__ == "__main__":
    unittest.main()
