"""
ARIA User Interface Subsystem.
Presentation layer for CLI and Desktop GUI applications.
"""

from aria.ui.app import launch_ui
from aria.ui.cli import run_cli_app

__all__ = ["launch_ui", "run_cli_app"]
