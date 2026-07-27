"""
OpenAI LLM Provider using the official OpenAI Python SDK.
"""

import os
import logging
from typing import Any, Dict, Iterator, List, Optional
from aria.llm.base import BaseLLMProvider, LLMMessage, LLMResponse
from aria.llm.exceptions import (
    ProviderInitializationError,
    APIConnectionError,
    AuthenticationError,
    RateLimitError,
    LLMException
)
from aria.utils.logger import get_logger

try:
    import openai
    from openai import OpenAI, OpenAIError
    from openai import APIConnectionError as OpenAIConnectionError
    from openai import AuthenticationError as OpenAIAuthenticationError
    from openai import RateLimitError as OpenAIRateLimitError
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    OpenAI = None
    OpenAIError = None
    OpenAIConnectionError = None
    OpenAIAuthenticationError = None
    OpenAIRateLimitError = None


class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI Provider implementation conforming to BaseLLMProvider.
    """

    def __init__(self, model_name: str = "gpt-4o", config: Optional[Dict[str, Any]] = None):
        super().__init__(model_name=model_name, config=config)
        self.logger = get_logger("aria.llm.openai")

        if not HAS_OPENAI:
            raise ProviderInitializationError(
                "The official 'openai' library is not installed.",
                provider_name="openai"
            )

        self.api_key = self.config.get("api_key") or os.getenv("OPENAI_API_KEY") or ""
        self.api_base = self.config.get("api_base") or os.getenv("OPENAI_API_BASE") or None
        self.simulated = self.config.get("simulated", False) or (self.api_key == "dummy-key" or not self.api_key)

        if not self.api_key:
            self.logger.warning("No OpenAI API key found. Defaulting to simulated execution.")
            self.api_key = "dummy-key"

        try:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.api_base
            )
        except Exception as e:
            raise ProviderInitializationError(
                f"Failed to initialize OpenAI SDK client: {e}",
                provider_name="openai",
                raw_error=e
            )

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def supports_streaming(self) -> bool:
        return True

    @property
    def supports_tools(self) -> bool:
        return True

    @property
    def max_context_window(self) -> int:
        # standard GPT-4o window is 128k
        return 128000

    def generate(self, messages: List[LLMMessage], **kwargs: Any) -> LLMResponse:
        self.logger.info(f"Generating completions using OpenAIProvider ({self.model_name})")
        
        if self.simulated:
            self.logger.info("OpenAIProvider running in simulated mode.")
            last_message = messages[-1].content if messages else ""
            reply = f"[Simulated OpenAI Response] Received: {last_message}"
            return LLMResponse(
                content=reply,
                model=self.model_name,
                finish_reason="stop",
                usage={"prompt_tokens": len(last_message.split()), "completion_tokens": len(reply.split())},
                metadata={"simulated": True, "provider": self.provider_name}
            )

        try:
            formatted_messages = [{"role": msg.role, "content": msg.content} for msg in messages]
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=formatted_messages,
                **kwargs
            )
            content = response.choices[0].message.content or ""
            return LLMResponse(
                content=content,
                model=response.model,
                finish_reason=response.choices[0].finish_reason or "stop",
                usage={
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0
                },
                raw_response=response,
                metadata={"provider": self.provider_name}
            )
        except OpenAIAuthenticationError as e:
            raise AuthenticationError(f"Authentication failed: {e}", provider_name="openai", raw_error=e)
        except OpenAIRateLimitError as e:
            raise RateLimitError(f"Rate limit exceeded: {e}", provider_name="openai", raw_error=e)
        except OpenAIConnectionError as e:
            raise APIConnectionError(f"Network connection failed: {e}", provider_name="openai", raw_error=e)
        except OpenAIError as e:
            raise LLMException(f"OpenAI API error: {e}", provider_name="openai", raw_error=e)
        except Exception as e:
            raise LLMException(f"Unexpected OpenAI error: {e}", provider_name="openai", raw_error=e)

    def stream(self, messages: List[LLMMessage], **kwargs: Any) -> Iterator[str]:
        self.logger.info(f"Streaming completions using OpenAIProvider ({self.model_name})")

        if self.simulated:
            self.logger.info("OpenAIProvider running stream in simulated mode.")
            response = self.generate(messages, **kwargs)
            for word in response.content.split(" "):
                yield word + " "
            return

        try:
            formatted_messages = [{"role": msg.role, "content": msg.content} for msg in messages]
            stream = self.client.chat.completions.create(
                model=self.model_name,
                messages=formatted_messages,
                stream=True,
                **kwargs
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except OpenAIAuthenticationError as e:
            raise AuthenticationError(f"Authentication failed: {e}", provider_name="openai", raw_error=e)
        except OpenAIRateLimitError as e:
            raise RateLimitError(f"Rate limit exceeded: {e}", provider_name="openai", raw_error=e)
        except OpenAIConnectionError as e:
            raise APIConnectionError(f"Network connection failed: {e}", provider_name="openai", raw_error=e)
        except OpenAIError as e:
            raise LLMException(f"OpenAI API error: {e}", provider_name="openai", raw_error=e)
        except Exception as e:
            raise LLMException(f"Unexpected OpenAI error: {e}", provider_name="openai", raw_error=e)
