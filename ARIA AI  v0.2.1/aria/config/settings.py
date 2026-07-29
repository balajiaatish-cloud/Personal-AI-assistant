"""
Settings module for loading YAML configuration and environment variables.
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional
try:
    import yaml
    HAS_YAML = True
except ImportError:
    yaml = None  # type: ignore
    HAS_YAML = False

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass



class AppConfig:
    def __init__(self, name: str = "ARIA", version: str = "0.2.0", environment: str = "development"):
        self.name = name
        self.version = version
        self.environment = environment


class LoggingConfig:
    def __init__(
        self,
        level: str = "INFO",
        console_output: bool = True,
        file_output: bool = True,
        file_path: str = "logs/aria.log"
    ):
        self.level = level
        self.console_output = console_output
        self.file_output = file_output
        self.file_path = file_path


class ModulesConfig:
    def __init__(self, raw_modules: Optional[Dict[str, Any]] = None):
        raw = raw_modules or {}
        self.memory_enabled = raw.get("memory", {}).get("enabled", False)
        self.tools_enabled = raw.get("tools", {}).get("enabled", False)
        self.voice_enabled = raw.get("voice", {}).get("enabled", False)
        self.agents_enabled = raw.get("agents", {}).get("enabled", False)
        self.ui_type = raw.get("ui", {}).get("type", "cli")


class Settings:
    """
    Centralized Settings holding application, logging, and module configurations.
    """
    def __init__(
        self,
        app: Optional[AppConfig] = None,
        logging_cfg: Optional[LoggingConfig] = None,
        modules: Optional[ModulesConfig] = None
    ):
        self.app = app or AppConfig()
        self.logging = logging_cfg or LoggingConfig()
        self.modules = modules or ModulesConfig()

    @classmethod
    def from_yaml(cls, config_path: str) -> "Settings":
        path = Path(config_path)
        if not path.is_file() or not HAS_YAML:
            # Fallback to default if file doesn't exist or yaml is unavailable
            return cls()

        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        app_data = data.get("app", {})
        log_data = data.get("logging", {})
        mod_data = data.get("modules", {})

        # Environment variable overrides
        env = os.getenv("ARIA_ENV", app_data.get("environment", "development"))
        log_level = os.getenv("ARIA_LOG_LEVEL", log_data.get("level", "INFO"))

        app_cfg = AppConfig(
            name=app_data.get("name", "ARIA"),
            version=app_data.get("version", "0.2.0"),
            environment=env
        )

        logging_cfg = LoggingConfig(
            level=log_level,
            console_output=log_data.get("console_output", True),
            file_output=log_data.get("file_output", True),
            file_path=log_data.get("file_path", "logs/aria.log")
        )

        modules_cfg = ModulesConfig(mod_data)

        return cls(app=app_cfg, logging_cfg=logging_cfg, modules=modules_cfg)


def load_settings(config_path: str = "config/config.yaml") -> Settings:
    """
    Convenience function to load settings from a given file path or default.
    """
    env_config_path = os.getenv("ARIA_CONFIG_PATH")
    target_path = env_config_path or config_path
    return Settings.from_yaml(target_path)
