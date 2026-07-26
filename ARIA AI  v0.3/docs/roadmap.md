# ARIA Development Roadmap

This document outlines the planned development phases and future capabilities for **ARIA** (Modular Desktop AI Assistant).

---

## Phase 1: Project Foundation & Core Architecture (v0.1.0) - [Completed]
- [x] Initial modular project skeleton (`aria/core`, `config`, `utils`, `memory`, `tools`, `voice`, `agents`, `ui`)
- [x] YAML & `.env` configuration loader with fallback defaults
- [x] Styled logging system with file rotation (`aria/utils/logger.py`)
- [x] Core engine orchestrator and lifecycle management (`aria/core/engine.py`)
- [x] CLI entry point launcher with argument parsing and signal handling (`aria/main.py`)
- [x] Base tool registry interfaces (`BaseTool`, `ToolRegistry`)
- [x] Automated unit test suite (`tests/`)

---

## Phase 2: Memory & Context Engine (v0.2.0)
- [ ] Short-term conversation history buffer
- [ ] Long-term persistent memory store (SQLite / JSON storage)
- [ ] Vector database integration (ChromaDB / Qdrant) for Retrieval-Augmented Generation (RAG)
- [ ] User preference & personality profile store

---

## Phase 3: Tools & Extension Framework (v0.3.0)
- [ ] Local filesystem & shell execution tools
- [ ] Web search & scraping tools
- [ ] Application launcher & system controls
- [ ] Security sandbox & permission manager for tool calls

---

## Phase 4: Voice & Speech Subsystem (v0.4.0)
- [ ] Speech-to-Text (STT) engine integration (Whisper / Vosk)
- [ ] Text-to-Speech (TTS) engine integration (Piper / Coqui / System TTS)
- [ ] Offline wake-word detection ("Hey ARIA")
- [ ] Audio stream buffer & noise cancellation pipeline

---

## Phase 5: Autonomous Multi-Agent Workflows (v0.5.0)
- [ ] Task decomposition & planner engine
- [ ] Specialized agent roles (Researcher, Coder, System Operator)
- [ ] Inter-agent communication queue
- [ ] Execution error recovery & feedback loops

---

## Phase 6: Desktop User Interface & Integration (v1.0.0)
- [ ] Modern Desktop GUI interface (PyQt / PySide / CustomTkinter / Tauri)
- [ ] System tray integration & global hotkeys
- [ ] Floating assistant overlay & voice visualizer
- [ ] Settings manager UI & plugin directory
