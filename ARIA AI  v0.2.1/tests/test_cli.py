"""
Unit tests for ARIA interactive CLI commands and execution.
"""

import unittest
from aria.config.settings import Settings
from aria.core.conversation import ConversationManager
from aria.ui.cli import handle_command


class TestCLI(unittest.TestCase):
    def setUp(self):
        self.settings = Settings()
        self.conv_manager = ConversationManager()

    def test_cli_exit_command(self):
        self.assertTrue(handle_command("exit", self.conv_manager, self.settings))
        self.assertTrue(handle_command("quit", self.conv_manager, self.settings))
        self.assertTrue(handle_command("/exit", self.conv_manager, self.settings))
        self.assertTrue(handle_command("/quit", self.conv_manager, self.settings))

    def test_cli_help_command(self):
        self.assertFalse(handle_command("help", self.conv_manager, self.settings))
        self.assertFalse(handle_command("/help", self.conv_manager, self.settings))

    def test_cli_version_command(self):
        self.assertFalse(handle_command("version", self.conv_manager, self.settings))
        self.assertFalse(handle_command("/version", self.conv_manager, self.settings))

    def test_cli_clear_command(self):
        self.conv_manager.process_user_message("Hello ARIA")
        self.assertEqual(len(self.conv_manager.get_messages()), 2)
        
        self.assertFalse(handle_command("clear", self.conv_manager, self.settings))
        self.assertEqual(len(self.conv_manager.get_messages()), 0)

    def test_cli_history_command(self):
        self.conv_manager.process_user_message("Testing history cmd")
        self.assertFalse(handle_command("history", self.conv_manager, self.settings))
        self.assertFalse(handle_command("/history", self.conv_manager, self.settings))

    def test_cli_normal_prompt_processing(self):
        result = handle_command("Hello there!", self.conv_manager, self.settings)
        self.assertFalse(result)
        messages = self.conv_manager.get_messages()
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].content, "Hello there!")
        self.assertEqual(messages[1].content, "Echo: Hello there! — No AI model connected")


if __name__ == "__main__":
    unittest.main()
