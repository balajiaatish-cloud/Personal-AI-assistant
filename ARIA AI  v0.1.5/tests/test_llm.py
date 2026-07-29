"""
Unit tests for ARIA LLM module.
"""

import unittest
from aria.llm.base import LLMMessage, LLMResponse
from aria.llm.provider import (
    MockLLMProvider,
    GenericAPILLMProvider,
    LLMProviderFactory,
    get_provider
)


class TestLLMModule(unittest.TestCase):
    def test_llm_message_serialization(self):
        msg = LLMMessage(role="user", content="Hello ARIA", name="User1", metadata={"key": "value"})
        msg_dict = msg.to_dict()

        self.assertEqual(msg_dict["role"], "user")
        self.assertEqual(msg_dict["content"], "Hello ARIA")
        self.assertEqual(msg_dict["name"], "User1")
        self.assertEqual(msg_dict["metadata"], {"key": "value"})

        deserialized = LLMMessage.from_dict(msg_dict)
        self.assertEqual(deserialized.role, "user")
        self.assertEqual(deserialized.content, "Hello ARIA")
        self.assertEqual(deserialized.name, "User1")

    def test_mock_provider_generate_and_stream(self):
        provider = MockLLMProvider(model_name="mock-v1")
        self.assertEqual(provider.provider_name, "mock")

        messages = [LLMMessage(role="user", content="Test prompt")]
        response = provider.generate(messages)

        self.assertIsInstance(response, LLMResponse)
        self.assertTrue(len(response.content) > 0)
        self.assertEqual(response.model, "mock-v1")

        # Stream test
        chunks = list(provider.stream(messages))
        self.assertTrue(len(chunks) > 0)
        self.assertEqual("".join(chunks), response.content)

    def test_mock_provider_echo(self):
        provider = MockLLMProvider()
        messages = [LLMMessage(role="user", content="Echo: Ping")]
        response = provider.generate(messages)
        self.assertEqual(response.content, "Echo: Echo: Ping")

    def test_factory_and_get_provider(self):
        mock_p = get_provider("mock", model_name="test-mock")
        self.assertEqual(mock_p.provider_name, "mock")
        self.assertEqual(mock_p.model_name, "test-mock")

        openai_p = LLMProviderFactory.create("openai", model_name="gpt-4o")
        self.assertEqual(openai_p.provider_name, "openai")
        self.assertEqual(openai_p.model_name, "gpt-4o")

        with self.assertRaises(ValueError):
            LLMProviderFactory.create("invalid_provider")


if __name__ == "__main__":
    unittest.main()
