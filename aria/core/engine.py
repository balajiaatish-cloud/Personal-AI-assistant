"""
Core Engine and Orchestrator for ARIA.
Manages application lifecycle, module loading, event loops, and session management.
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
from aria.config.settings import Settings
from aria.core.session import SessionManager, Session
from aria.core.conversation import ConversationManager
from aria.llm.manager import LLMManager
from aria.llm.base import BaseLLMProvider
from aria.utils.logger import get_logger


class ARIAEngine:
    """
    Primary orchestrator for ARIA desktop AI assistant.
    Responsible for initializing, starting, and gracefully shutting down all sub-systems.
    """

    def __init__(self, settings: Settings, default_provider: Optional[BaseLLMProvider] = None):
        self.settings = settings
        self.logger: logging.Logger = get_logger("aria.core")
        self.is_running: bool = False
        self._subsystems: Dict[str, Any] = {}

        # Instantiate LLM Manager & Session Manager
        self.llm_manager = LLMManager(settings)
        active_provider = default_provider or self.llm_manager.active_provider
        self.session_manager = SessionManager(default_provider=active_provider)

    @property
    def conversation_manager(self) -> ConversationManager:
        """
        Return the active session's ConversationManager.
        """
        active = self.get_active_session()
        if not active:
            active = self.create_session(session_id="default")
        return active.conversation_manager

    def get_conversation_manager(self) -> ConversationManager:
        """
        Return the active conversation manager instance.
        """
        return self.conversation_manager

    def initialize(self) -> None:
        """
        Initialize core components and register configured subsystems.
        """
        self.logger.info(f"Initializing {self.settings.app.name} v{self.settings.app.version} [{self.settings.app.environment}]...")

        # Register Session subsystem
        self.logger.info(f"Registering Session Manager & LLM subsystem (Active Provider: {self.llm_manager.active_provider.provider_name})...")
        self._subsystems["session_manager"] = self.session_manager
        self._subsystems["llm_manager"] = self.llm_manager

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
        Start the engine event loop and prepare default session using system prompt from file.
        """
        if self.is_running:
            self.logger.warning("ARIA Engine is already running.")
            return

        self.is_running = True
        
        # Load external system prompt if available
        system_prompt = "You are ARIA, an intelligent desktop AI assistant."
        prompt_file = Path(__file__).resolve().parent.parent / "prompts" / "system_prompt.txt"
        if prompt_file.is_file():
            try:
                with open(prompt_file, "r", encoding="utf-8") as f:
                    system_prompt = f.read().strip()
                self.logger.debug(f"Loaded base system prompt from: {prompt_file}")
            except Exception as e:
                self.logger.error(f"Failed to read system prompt file: {e}")

        # Ensure at least one default session exists
        if not self.session_manager.get_active_session():
            self.session_manager.create_session(
                session_id="default",
                system_prompt=system_prompt
            )

        self.logger.info(f"{self.settings.app.name} Engine started.")

    def create_session(
        self,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        provider: Optional[BaseLLMProvider] = None
    ) -> Session:
        """
        Helper method to create a new session on the engine.
        """
        target_provider = provider or self.llm_manager.active_provider
        return self.session_manager.create_session(
            session_id=session_id,
            system_prompt=system_prompt,
            provider=target_provider
        )

    def get_active_session(self) -> Optional[Session]:
        """
        Get the currently active session.
        """
        return self.session_manager.get_active_session()

    def send_message(self, message: str, session_id: Optional[str] = None, **kwargs: Any) -> str:
        """
        Send a message to the active (or specified) session and return the LLM response.
        """
        target_session = (
            self.session_manager.get_session(session_id)
            if session_id
            else self.session_manager.get_active_session()
        )
        if not target_session:
            target_session = self.create_session(session_id=session_id or "default")

        return target_session.send_message(message, **kwargs)

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
        active_session = self.session_manager.get_active_session()
        return {
            "app_name": self.settings.app.name,
            "version": self.settings.app.version,
            "running": self.is_running,
            "environment": self.settings.app.environment,
            "active_subsystems": list(self._subsystems.keys()),
            "total_sessions": len(self.session_manager.sessions),
            "active_session_id": active_session.session_id if active_session else None,
            "llm_provider": self.llm_manager.active_provider.provider_name,
            "llm_model": self.llm_manager.active_provider.model_name
        }
