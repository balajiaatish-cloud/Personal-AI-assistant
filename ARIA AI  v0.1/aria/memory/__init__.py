"""
ARIA Memory Subsystem.
Stub package for context handling, short-term memory, and vector databases.
"""

class BaseMemoryStore:
    """
    Abstract interface for memory persistence.
    """
    def save(self, key: str, data: str) -> None:
        raise NotImplementedError

    def retrieve(self, key: str) -> str:
        raise NotImplementedError
