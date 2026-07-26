"""
ARIA Application Entry Point.
"""

import argparse
import signal
import sys
from typing import Optional

from aria import __version__
from aria.config.settings import load_settings, Settings
from aria.core.engine import ARIAEngine
from aria.ui.app import launch_ui
from aria.utils.logger import setup_logger, get_logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="ARIA - Modular Desktop AI Assistant"
    )
    parser.add_argument(
        "-c", "--config",
        type=str,
        default="config/config.yaml",
        help="Path to YAML configuration file (default: config/config.yaml)"
    )
    parser.add_argument(
        "-l", "--log-level",
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Override logging level"
    )
    parser.add_argument(
        "-v", "--version",
        action="version",
        version=f"ARIA v{__version__}"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    # Load Settings
    settings: Settings = load_settings(args.config)
    if args.log_level:
        settings.logging.level = args.log_level

    # Initialize Central Logger
    logger = setup_logger(
        name="aria",
        level=settings.logging.level,
        log_file=settings.logging.file_path if settings.logging.file_output else None,
        console=settings.logging.console_output
    )

    logger.info(f"Starting ARIA (v{__version__})...")

    # Instantiate Core Engine
    engine = ARIAEngine(settings)

    # Setup Graceful Signal Handling
    def handle_signal(sig, frame):
        logger.info(f"Received signal {sig}. Initiating graceful shutdown...")
        engine.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    try:
        engine.initialize()
        engine.start()
        
        # Launch UI Interface layer
        launch_ui(settings)
        
        return 0
    except Exception as e:
        logger.critical(f"Unhandled exception during ARIA execution: {e}", exc_info=True)
        engine.shutdown()
        return 1


if __name__ == "__main__":
    sys.exit(main())
