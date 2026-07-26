"""
Unit tests for ARIA shared data models.
"""

import unittest
import uuid
from aria.models.message import Message
from aria.models.response import AssistantResponse
from aria.models.session import SessionModel


class TestModels(unittest.TestCase):
    def test_message_model(self):
        msg = Message(role="user", content="Test message")
        self.assertTrue(len(msg.id) > 0)
        self.assertTrue(len(msg.session_id) > 0)
        # Ensure id and session_id are valid UUIDs
        uuid.UUID(msg.id)
        uuid.UUID(msg.session_id)

        msg_dict = msg.to_dict()
        self.assertEqual(msg_dict["role"], "user")
        self.assertEqual(msg_dict["content"], "Test message")
        self.assertEqual(msg_dict["id"], msg.id)

        restored = Message.from_dict(msg_dict)
        self.assertEqual(restored.id, msg.id)
        self.assertEqual(restored.session_id, msg.session_id)

    def test_assistant_response_model(self):
        resp = AssistantResponse(content="Test response")
        self.assertTrue(len(resp.response_id) > 0)
        self.assertTrue(len(resp.session_id) > 0)
        uuid.UUID(resp.response_id)
        uuid.UUID(resp.session_id)

        resp_dict = resp.to_dict()
        self.assertEqual(resp_dict["content"], "Test response")
        self.assertEqual(resp_dict["model"], "placeholder-echo")

        restored = AssistantResponse.from_dict(resp_dict)
        self.assertEqual(restored.response_id, resp.response_id)

    def test_session_model(self):
        session = SessionModel(system_prompt="System prompt")
        self.assertTrue(len(session.session_id) > 0)
        uuid.UUID(session.session_id)
        self.assertTrue(session.is_active)

        sess_dict = session.to_dict()
        self.assertEqual(sess_dict["system_prompt"], "System prompt")

        restored = SessionModel.from_dict(sess_dict)
        self.assertEqual(restored.session_id, session.session_id)


if __name__ == "__main__":
    unittest.main()
