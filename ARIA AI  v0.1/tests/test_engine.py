"""
Unit tests for core engine lifecycle.
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

        engine.shutdown()
        self.assertFalse(engine.is_running)


if __name__ == "__main__":
    unittest.main()
