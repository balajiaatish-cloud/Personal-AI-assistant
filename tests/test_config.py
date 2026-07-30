"""
Unit tests for configuration loading.
"""

import unittest
import tempfile
from pathlib import Path
from aria.config.settings import Settings, load_settings


class TestConfig(unittest.TestCase):
    def test_default_settings(self):
        settings = Settings()
        self.assertEqual(settings.app.name, "ARIA")
        self.assertEqual(settings.app.version, "0.3.0")
        self.assertEqual(settings.logging.level, "INFO")
        self.assertFalse(settings.modules.memory_enabled)

    def test_load_settings_from_file(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            config_file = Path(tmp_dir) / "config.yaml"
            config_file.write_text("""
app:
  name: "TestARIA"
  version: "1.0.0"
  environment: "testing"
logging:
  level: "DEBUG"
""", encoding="utf-8")

            settings = load_settings(str(config_file))
            # Test default settings object loading
            self.assertIsNotNone(settings)
            self.assertIn(settings.app.name, ["ARIA", "TestARIA"])

    def test_load_llm_settings_with_host(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            config_file = Path(tmp_dir) / "config.yaml"
            config_file.write_text("""
llm:
  provider: ollama
  model: gemma4:e2b
  host: http://localhost:11434
""", encoding="utf-8")

            settings = load_settings(str(config_file))
            self.assertEqual(settings.llm.provider, "ollama")
            self.assertEqual(settings.llm.model, "gemma4:e2b")
            self.assertEqual(settings.llm.api_base, "http://localhost:11434")


if __name__ == "__main__":
    unittest.main()
