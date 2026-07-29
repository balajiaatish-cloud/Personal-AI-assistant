"""
ARIA Voice Subsystem.
Stub package for Speech-to-Text (STT) and Text-to-Speech (TTS) integration.
"""

class BaseVoiceEngine:
    """
    Abstract interface for voice interaction engines.
    """
    def listen(self) -> str:
        raise NotImplementedError

    def speak(self, text: str) -> None:
        raise NotImplementedError
