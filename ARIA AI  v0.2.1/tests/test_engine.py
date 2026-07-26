"""
Unit tests for core engine lifecycle and session integration.
"""

import unittest
from aria.config.settings import Settings
from aria.core.engine import ARIAEngine


class TestEngine(unittest.TestCase):
    def test_engine_lifecycle(self):
        settings = Settings()
        engine = ARIAEngine(settings)

        self.assertFalse(engine.is_running)
        engine.initialize()

        engine.start()
        self.assertTrue(engine.is_running)

        status = engine.get_status()
        self.assertEqual(status["app_name"], "ARIA")
        self.assertTrue(status["running"])
        self.assertIn("session_manager", status["active_subsystems"])
        self.assertEqual(status["total_sessions"], 1)

        engine.shutdown()
        self.assertFalse(engine.is_running)

    def test_engine_message_sending(self):
        settings = Settings()
        engine = ARIAEngine(settings)
        engine.initialize()
        engine.start()

        reply = engine.send_message("Echo: Hello Engine")
        self.assertEqual(reply, "Echo: Echo: Hello Engine")

        active_sess = engine.get_active_session()
        self.assertIsNotNone(active_sess)
        self.assertEqual(len(active_sess.conversation.messages), 2)

        engine.shutdown()


if __name__ == "__main__":
    unittest.main()
