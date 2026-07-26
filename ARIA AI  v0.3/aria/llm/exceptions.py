"""
Custom LLM exceptions for ARIA.
"""

from typing import Optional


class LLMException(Exception):
    """
    Base exception class for all LLM-related errors in ARIA.
    """
    def __init__(self, message: str, provider_name: str, raw_error: Optional[Exception] = None):
        super().__init__(f"[{provider_name}] {message}")
        self.message = message
        self.provider_name = provider_name
        self.raw_error = raw_error


class ProviderInitializationError(LLMException):
    """
    Raised when an LLM provider fails to initialize (e.g. missing API keys or wrong configuration).
    """
    pass


class APIConnectionError(LLMException):
    """
    Raised when connection to LLM provider endpoints fails.
    """
    pass


class AuthenticationError(LLMException):
    """
    Raised when credentials provided to an LLM provider are rejected.
    """
    pass


class RateLimitError(LLMException):
    """
    Raised when an LLM provider indicates rate limits have been exceeded.
    """
    pass
