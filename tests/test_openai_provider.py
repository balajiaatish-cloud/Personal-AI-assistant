"""
Unit tests for the OpenAI concrete provider.
"""

import unittest
from aria.llm.base import LLMMessage
from aria.llm.providers.openai import OpenAIProvider
from aria.llm.exceptions import ProviderInitializationError


class TestOpenAIProvider(unittest.TestCase):
    def test_openai_capabilities(self):
        # Instantiate in simulated mode to prevent real API calls
        provider = OpenAIProvider(model_name="gpt-4o", config={"simulated": True})
        self.assertEqual(provider.provider_name, "openai")
        self.assertTrue(provider.supports_streaming)
        self.assertTrue(provider.supports_tools)
        self.assertEqual(provider.max_context_window, 128000)

    def test_openai_generate_simulation(self):
        provider = OpenAIProvider(model_name="gpt-4o", config={"simulated": True})
        messages = [LLMMessage(role="user", content="Hello OpenAI")]
        response = provider.generate(messages)
        self.assertEqual(response.content, "[Simulated OpenAI Response] Received: Hello OpenAI")
        self.assertEqual(response.model, "gpt-4o")

    def test_openai_stream_simulation(self):
        provider = OpenAIProvider(model_name="gpt-4", config={"simulated": True})
        messages = [LLMMessage(role="user", content="Stream me")]
        chunks = list(provider.stream(messages))
        self.assertEqual("".join(chunks), "[Simulated OpenAI Response] Received: Stream me ")


if __name__ == "__main__":
    unittest.main()
