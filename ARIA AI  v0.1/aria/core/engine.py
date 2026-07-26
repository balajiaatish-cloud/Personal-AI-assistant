"""
Core Engine and Orchestrator for ARIA.
Manages application lifecycle, module loading, and event loops.
"""

import logging
from typing import Dict, Any, Optional
from aria.config.settings import Settings
from aria.utils.logger import get_logger


class ARIAEngine:
    """
    Primary orchestrator for ARIA desktop AI assistant.
    Responsible for initializing, starting, and gracefully shutting down all sub-systems.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger: logging.Logger = get_logger("aria.core")
        self.is_running: bool = False
        self._subsystems: Dict[str, Any] = {}

    def initialize(self) -> None:
        """
        Initialize core components and register configured subsystems.
        """
        self.logger.info(f"Initializing {self.settings.app.name} v{self.settings.app.version} [{self.settings.app.environment}]...")

        # Subsystem registration placeholders
        if self.settings.modules.memory_enabled:
            self.logger.info("Registering Memory subsystem...")
        if self.settings.modules.tools_enabled:
            self.logger.info("Registering Tools subsystem...")
        if self.settings.modules.voice_enabled:
            self.logger.info("Registering Voice subsystem...")
        if self.settings.modules.agents_enabled:
            self.logger.info("Registering Agent framework subsystem...")

        self.logger.info("Core engine initialization completed successfully.")

    def start(self) -> None:
        """
        Start the engine event loop.
        """
        if self.is_running:
            self.logger.warning("ARIA Engine is already running.")
            return

        self.is_running = True
        self.logger.info(f"{self.settings.app.name} Engine started.")

    def shutdown(self) -> None:
        """
        Gracefully stop subsystems and cleanup resources.
        """
        if not self.is_running:
            self.logger.info("ARIA Engine is not running.")
            return

        self.logger.info("Shutting down ARIA Engine subsystems...")
        self.is_running = False
        self.logger.info("ARIA Engine shutdown complete.")

    def get_status(self) -> Dict[str, Any]:
        """
        Return the current operating status of the engine.
        """
        return {
            "app_name": self.settings.app.name,
            "version": self.settings.app.version,
            "running": self.is_running,
            "environment": self.settings.app.environment,
            "active_subsystems": list(self._subsystems.keys())
        }
