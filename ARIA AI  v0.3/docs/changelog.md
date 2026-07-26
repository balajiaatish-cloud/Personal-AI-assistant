# Changelog

All notable changes to the **ARIA** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-26

### Added
- **Shared Data Models (`aria/models/`)**: Centralized `Message`, `AssistantResponse`, and `SessionModel` data models with UUID `message_id` and `session_id` fields.
- **Conversation Manager**: Implemented `ConversationManager` in `aria/core/conversation.py` to store and manage message history.
- **Interactive CLI Chat Engine**: Created interactive terminal loop in `aria/ui/cli.py` supporting continuous execution, signal handling, and built-in commands (`help`, `clear`, `version`, `exit`).
- **Placeholder Echo Execution**: Decoupled UI from LLM layer; UI communicates strictly with `ConversationManager`.
- **LLM Provider Abstraction**: Implemented `BaseLLMProvider`, `LLMMessage`, `LLMResponse`, and `LLMProviderFactory` in `aria/llm/`.

---

## [0.1.0] - 2026-07-25

### Added
- **Project Skeleton**: Established clean, modular directory structure under `aria/` package.
- **Core Engine**: Implemented `ARIAEngine` in `aria/core/engine.py` for lifecycle orchestration (initialize, start, status, shutdown).
- **Configuration Management**: Created `aria/config/settings.py` to parse `config/config.yaml` and `.env` environment variables with graceful fallback defaults.
- **Logging Utility**: Implemented `aria/utils/logger.py` with colored console logs and rotating file outputs.
- **Tool Framework Interfaces**: Created `BaseTool` abstract base class and `ToolRegistry` stub in `aria/tools/base.py`.
- **Subsystem Stubs**: Created placeholder interfaces for `memory`, `voice`, `agents`, and `ui`.
- **CLI Launcher Entry Point**: Created `aria/main.py` with argument parsing (`--config`, `--log-level`, `--version`), logger setup, signal handling, and clean exit codes.
- **Project Infrastructure**: Added `pyproject.toml`, `requirements.txt`, `.env.example`, `.gitignore`, and `README.md`.
- **Documentation**: Added `docs/architecture.md`, `docs/roadmap.md`, and `docs/changelog.md`.
- **Testing**: Added unit test suite in `tests/test_config.py` and `tests/test_engine.py`.
