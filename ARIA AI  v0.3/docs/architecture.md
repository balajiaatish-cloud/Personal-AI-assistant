# ARIA Architecture Overview

ARIA is designed with a decoupled, component-based architecture to allow straightforward feature additions (Memory, Tools, Voice processing, Agents, and GUI).

## Core Modules

1. **`aria.core`**: Manages application lifecycle, event looping, and subsystem registration.
2. **`aria.config`**: Loads and validates configurations from YAML settings files and environment overrides.
3. **`aria.utils`**: Handles structured logging and shared utilities.
4. **`aria.memory`**: Interface layer for short-term conversation context, vector stores, and long-term memory.
5. **`aria.tools`**: Standard base interfaces for tool execution (`BaseTool`) and plugin registries.
6. **`aria.voice`**: Stubs for Speech-to-Text (STT) and Text-to-Speech (TTS) integration.
7. **`aria.agents`**: Multi-agent task orchestration layer.
8. **`aria.ui`**: Presentation layer supporting CLI and Desktop GUI interfaces.
