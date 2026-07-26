"""
UI Application Launcher.
"""

import logging
from typing import Optional
from aria.config.settings import Settings
from aria.core.engine import ARIAEngine
from aria.ui.cli import run_cli_app
from aria.utils.logger import get_logger


def launch_ui(settings: Settings, engine: Optional[ARIAEngine] = None) -> None:
    """
    Launch the configured UI interface (CLI or Desktop GUI).
    """
    logger: logging.Logger = get_logger("aria.ui")
    ui_type = settings.modules.ui_type.lower()

    if ui_type == "cli":
        run_cli_app(settings, engine)
    else:
        logger.info(f"UI mode '{ui_type}' configured. GUI interface placeholder ready.")
        print(f"GUI mode ('{ui_type}') is configured. Launching CLI fallback...")
        run_cli_app(settings, engine)
