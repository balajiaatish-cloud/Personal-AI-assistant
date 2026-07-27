"""
Session and SessionManager for managing user interactive turns and active provider context.
"""

import uuid
import logging
from typing import Any, Dict, Iterator, List, Optional
from aria.models.session import SessionModel
from aria.core.conversation import Conversation, ConversationManager
from aria.llm.base import BaseLLMProvider, LLMResponse
from aria.llm.registry import LLMProviderRegistry
from aria.utils.logger import get_logger


class Session:
    """
    Encapsulates an active interactive chat session, linking conversation context with an LLM provider.
    """

    def __init__(
        self,
        session_id: Optional[str] = None,
        conversation: Optional[Conversation] = None,
        provider: Optional[BaseLLMProvider] = None,
        system_prompt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.model: SessionModel = SessionModel(
            session_id=session_id or str(uuid.uuid4()),
            system_prompt=system_prompt,
            metadata=metadata or {}
        )
        self.conversation: Conversation = conversation or Conversation(
            conversation_id=f"conv_{self.session_id}",
            session_id=self.session_id,
            system_prompt=system_prompt,
        )
        self.provider: BaseLLMProvider = provider or LLMProviderRegistry.create("mock", "mock-model")
        
        # Inject the provider into ConversationManager (Dependency Injection)
        self.conversation_manager: ConversationManager = ConversationManager(
            provider=self.provider,
            session_id=self.session_id,
            system_prompt=system_prompt
        )
        # Sync conversation manager conversation with session conversation
        self.conversation_manager.conversation = self.conversation
        self.logger: logging.Logger = get_logger("aria.core.session")

    @property
    def session_id(self) -> str:
        return self.model.session_id

    @property
    def created_at(self) -> str:
        return self.model.created_at

    @property
    def last_active_at(self) -> str:
        return self.model.last_active_at

    @property
    def is_active(self) -> bool:
        return self.model.is_active

    @is_active.setter
    def is_active(self, value: bool) -> None:
        self.model.is_active = value

    def touch(self) -> None:
        self.model.touch()

    def send_message(self, user_input: str, **kwargs: Any) -> str:
        """
        Send a user message through provider execution.
        """
        return self.conversation_manager.process_user_message(user_input)

    def stream_message(self, user_input: str, **kwargs: Any) -> Iterator[str]:
        """
        Send a user message and stream response chunks back while building the final assistant message.
        """
        self.touch()
        self.conversation.add_user_message(user_input)

        llm_messages = self.conversation.to_llm_messages()
        self.logger.debug(f"Session '{self.session_id}' streaming from provider '{self.provider.provider_name}'.")

        full_content_chunks = []
        for chunk in self.provider.stream(llm_messages, **kwargs):
            full_content_chunks.append(chunk)
            yield chunk

        full_response = "".join(full_content_chunks)
        self.conversation.add_assistant_message(full_response)

    def clear_history(self) -> None:
        """
        Clear conversation history for this session.
        """
        self.conversation.clear()
        self.touch()

    def to_dict(self) -> Dict[str, Any]:
        data = self.model.to_dict()
        data["provider_name"] = self.provider.provider_name
        data["model_name"] = self.provider.model_name
        data["conversation"] = self.conversation.to_dict()
        return data


class SessionManager:
    """
    Manages creation, switching, retrieval, and closing of user interactive sessions.
    """

    def __init__(self, default_provider: Optional[BaseLLMProvider] = None):
        self.sessions: Dict[str, Session] = {}
        self.active_session_id: Optional[str] = None
        self.default_provider: BaseLLMProvider = default_provider or LLMProviderRegistry.create("mock", "mock-model")
        self.logger: logging.Logger = get_logger("aria.core.session_manager")

    def create_session(
        self,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        provider: Optional[BaseLLMProvider] = None,
        set_as_active: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Session:
        """
        Create and store a new interaction session.
        """
        target_provider = provider or self.default_provider
        session = Session(
            session_id=session_id,
            provider=target_provider,
            system_prompt=system_prompt,
            metadata=metadata,
        )
        self.sessions[session.session_id] = session
        self.logger.info(f"Created session '{session.session_id}'.")

        if set_as_active or self.active_session_id is None:
            self.active_session_id = session.session_id

        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """
        Retrieve session by session_id.
        """
        return self.sessions.get(session_id)

    def get_active_session(self) -> Optional[Session]:
        """
        Get the currently active session.
        """
        if self.active_session_id:
            return self.sessions.get(self.active_session_id)
        return None

    def set_active_session(self, session_id: str) -> bool:
        """
        Set session_id as the active session.
        """
        if session_id in self.sessions:
            self.active_session_id = session_id
            return True
        return False

    def close_session(self, session_id: str) -> bool:
        """
        Deactivate and remove session.
        """
        session = self.sessions.get(session_id)
        if not session:
            return False

        session.is_active = False
        del self.sessions[session_id]

        if self.active_session_id == session_id:
            remaining_ids = list(self.sessions.keys())
            self.active_session_id = remaining_ids[0] if remaining_ids else None

        self.logger.info(f"Closed session '{session_id}'.")
        return True

    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        Return metadata list of all managed sessions.
        """
        return [
            {
                "session_id": s.session_id,
                "is_active_session": (s.session_id == self.active_session_id),
                "created_at": s.created_at,
                "last_active_at": s.last_active_at,
                "message_count": len(s.conversation.messages),
                "provider": s.provider.provider_name,
                "model": s.provider.model_name,
            }
            for s in self.sessions.values()
        ]
