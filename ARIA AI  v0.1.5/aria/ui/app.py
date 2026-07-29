"""
UI Application Launcher Stub.
"""

import logging
from aria.config.settings import Settings
from aria.utils.logger import get_logger


def launch_ui(settings: Settings) -> None:
    """
    Launch the configured UI interface (CLI or Desktop GUI).
    """
    logger: logging.Logger = get_logger("aria.ui")
    ui_type = settings.modules.ui_type.lower()

    if ui_type == "cli":
        logger.info("Starting ARIA CLI Interface...")
        print("\n===========================================")
        print(f"       Welcome to {settings.app.name} (v{settings.app.version})")
        print("   Modular Desktop AI Assistant Skeleton")
        print("===========================================\n")
        print("System initialized. Ready for module integrations.")
    else:
        logger.info(f"UI mode '{ui_type}' configured. GUI interface placeholder ready.")
