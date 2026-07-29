"""
Unit tests for ARIA Session and SessionManager.
"""

import unittest
from aria.core.session import Session, SessionManager
from aria.llm.provider import MockLLMProvider


class TestSession(unittest.TestCase):
    def test_session_interaction(self):
        provider = MockLLMProvider(default_reply="Hello user!")
        session = Session(session_id="test_sess", provider=provider)

        reply = session.send_message("Greetings")
        self.assertEqual(reply, "Hello user!")
        self.assertEqual(len(session.conversation.messages), 2)
        self.assertEqual(session.conversation.messages[0].content, "Greetings")
        self.assertEqual(session.conversation.messages[1].content, "Hello user!")

    def test_session_streaming(self):
        provider = MockLLMProvider(default_reply="Hello streaming world")
        session = Session(session_id="stream_sess", provider=provider)

        chunks = list(session.stream_message("Stream to me"))
        self.assertTrue(len(chunks) > 0)
        self.assertEqual("".join(chunks), "Hello streaming world")
        self.assertEqual(len(session.conversation.messages), 2)

    def test_session_manager(self):
        manager = SessionManager()
        s1 = manager.create_session(session_id="s1")
        s2 = manager.create_session(session_id="s2")

        self.assertEqual(len(manager.sessions), 2)
        self.assertEqual(manager.get_active_session().session_id, "s2")

        manager.set_active_session("s1")
        self.assertEqual(manager.get_active_session().session_id, "s1")

        session_list = manager.list_sessions()
        self.assertEqual(len(session_list), 2)

        manager.close_session("s1")
        self.assertEqual(len(manager.sessions), 1)
        self.assertEqual(manager.get_active_session().session_id, "s2")


if __name__ == "__main__":
    unittest.main()
