"""
Session and SessionManager for managing user interactive turns and active provider context.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, List, Optional
from aria.core.conversation import Conversation
from aria.llm.base import BaseLLMProvider, LLMResponse
from aria.llm.provider import get_provider
from aria.utils.logger import get_logger


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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
        self.session_id: str = session_id or str(uuid.uuid4())
        self.created_at: str = get_utc_now_iso()
        self.last_active_at: str = self.created_at
        self.is_active: bool = True
        self.conversation: Conversation = conversation or Conversation(
            conversation_id=f"conv_{self.session_id}",
            system_prompt=system_prompt,
        )
        self.provider: BaseLLMProvider = provider or get_provider("mock")
        self.metadata: Dict[str, Any] = metadata or {}
        self.logger: logging.Logger = get_logger("aria.core.session")

    def touch(self) -> None:
        self.last_active_at = get_utc_now_iso()

    def send_message(self, user_input: str, **kwargs: Any) -> str:
        """
        Send a user message, invoke the LLM provider, update conversation history, and return the response.
        """
        self.touch()
        self.conversation.add_user_message(user_input)
        
        llm_messages = self.conversation.to_llm_messages()
        self.logger.debug(f"Session '{self.session_id}' sending {len(llm_messages)} messages to provider '{self.provider.provider_name}'.")

        response: LLMResponse = self.provider.generate(llm_messages, **kwargs)
        self.conversation.add_assistant_message(response.content, metadata=response.metadata)
        
        return response.content

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
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "last_active_at": self.last_active_at,
            "is_active": self.is_active,
            "provider_name": self.provider.provider_name,
            "model_name": self.provider.model_name,
            "conversation": self.conversation.to_dict(),
            "metadata": self.metadata,
        }


class SessionManager:
    """
    Manages creation, switching, retrieval, and closing of user interactive sessions.
    """

    def __init__(self, default_provider: Optional[BaseLLMProvider] = None):
        self.sessions: Dict[str, Session] = {}
        self.active_session_id: Optional[str] = None
        self.default_provider: BaseLLMProvider = default_provider or get_provider("mock")
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
