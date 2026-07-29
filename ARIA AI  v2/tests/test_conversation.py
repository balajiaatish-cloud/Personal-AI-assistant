"""
Unit tests for ARIA Conversation and Message models.
"""

import unittest
from aria.core.conversation import Conversation, Message


class TestConversation(unittest.TestCase):
    def test_message_creation_and_conversion(self):
        msg = Message(role="user", content="Hello world")
        self.assertEqual(msg.role, "user")
        self.assertEqual(msg.content, "Hello world")
        
        llm_msg = msg.to_llm_message()
        self.assertEqual(llm_msg.role, "user")
        self.assertEqual(llm_msg.content, "Hello world")

    def test_conversation_history_management(self):
        conv = Conversation(system_prompt="You are a helpful assistant.")
        self.assertEqual(conv.system_prompt, "You are a helpful assistant.")
        self.assertEqual(len(conv.messages), 0)

        conv.add_user_message("Hi")
        conv.add_assistant_message("Hello! How can I help you today?")

        self.assertEqual(len(conv.messages), 2)
        all_msgs = conv.get_messages(include_system=True)
        self.assertEqual(len(all_msgs), 3)
        self.assertEqual(all_msgs[0].role, "system")
        self.assertEqual(all_msgs[1].role, "user")
        self.assertEqual(all_msgs[2].role, "assistant")

    def test_conversation_pruning(self):
        conv = Conversation()
        for i in range(10):
            conv.add_user_message(f"Message {i}")

        conv.prune_history(max_messages=4)
        self.assertEqual(len(conv.messages), 4)
        self.assertEqual(conv.messages[0].content, "Message 6")
        self.assertEqual(conv.messages[-1].content, "Message 9")

    def test_conversation_serialization(self):
        conv = Conversation(system_prompt="Test system prompt")
        conv.add_user_message("What is Python?")
        conv.add_assistant_message("Python is a programming language.")

        data = conv.to_dict()
        restored = Conversation.from_dict(data)

        self.assertEqual(restored.conversation_id, conv.conversation_id)
        self.assertEqual(restored.system_prompt, "Test system prompt")
        self.assertEqual(len(restored.messages), 2)
        self.assertEqual(restored.messages[0].content, "What is Python?")


if __name__ == "__main__":
    unittest.main()
