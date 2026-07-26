"""
Interactive CLI Chat Engine for ARIA.
Communicates strictly with the ConversationManager and handles built-in commands.
"""

import os
import sys
import logging
from typing import Optional
from aria.config.settings import Settings
from aria.core.conversation import ConversationManager
from aria.core.engine import ARIAEngine
from aria.utils.logger import get_logger


def print_banner(settings: Settings) -> None:
    """
    Display the ARIA CLI startup banner.
    """
    print("\n===========================================")
    print(f"       Welcome to {settings.app.name} (v{settings.app.version})")
    print("   Modular Desktop AI Assistant")
    print("===========================================")
    print("Type 'help' for available commands or 'exit' to quit.\n")


def print_help() -> None:
    """
    Display CLI help documentation and built-in commands.
    """
    print("\nAvailable Built-in Commands:")
    print("  help, /help       - Display available CLI commands")
    print("  version, /version - Display current ARIA version")
    print("  history, /history - Display conversation history")
    print("  clear, /clear     - Clear terminal screen and conversation history")
    print("  exit, quit, /exit - Exit ARIA AI assistant\n")


def print_history(conv_manager: ConversationManager) -> None:
    """
    Display the stored message history in a structured layout.
    """
    messages = conv_manager.get_messages(include_system=True)
    if not messages:
        print("\nNo message history found.\n")
        return

    print("\n--- Conversation History ---")
    for msg in messages:
        # Extract role and content cleanly
        role_label = msg.role.upper()
        print(f"[{msg.timestamp}] {role_label}: {msg.content}")
    print("----------------------------\n")


def handle_command(
    user_input: str,
    conv_manager: ConversationManager,
    settings: Settings,
    engine: Optional[ARIAEngine] = None
) -> Optional[bool]:
    """
    Process input string. If it is a built-in command, handle it and return boolean exit flag.
    If it is normal text, forward to ConversationManager and return None.
    """
    cmd_raw = user_input.strip().lower()

    if cmd_raw in ["exit", "quit", "/exit", "/quit"]:
        print("Goodbye! Exiting ARIA...")
        return True

    if cmd_raw in ["help", "/help"]:
        print_help()
        return False

    if cmd_raw in ["history", "/history"]:
        print_history(conv_manager)
        return False

    if cmd_raw in ["clear", "/clear"]:
        conv_manager.clear_history()
        # Attempt to clear terminal screen
        os.system("cls" if os.name == "nt" else "clear")
        print_banner(settings)
        print("Conversation history and screen cleared.\n")
        return False

    if cmd_raw in ["version", "/version"]:
        print(f"{settings.app.name} v{settings.app.version} [{settings.app.environment}]\n")
        return False

    # Normal text: Forward exclusively to ConversationManager.process_user_message()
    response = conv_manager.process_user_message(user_input)
    print(f"ARIA > {response}\n")
    return False


def run_cli_app(settings: Settings, engine: Optional[ARIAEngine] = None) -> None:
    """
    Main interactive CLI loop. Keeps running until the user explicitly exits.
    """
    logger: logging.Logger = get_logger("aria.ui.cli")
    logger.info("Starting ARIA interactive CLI Chat Engine...")

    # Obtain ConversationManager from engine or instantiate standalone
    if engine:
        conv_manager = engine.conversation_manager
    else:
        conv_manager = ConversationManager()

    print_banner(settings)

    try:
        while True:
            try:
                user_input = input("You > ")
            except (KeyboardInterrupt, EOFError):
                print("\nReceived exit signal. Shutting down ARIA...")
                break

            if not user_input.strip():
                continue

            should_exit = handle_command(user_input, conv_manager, settings, engine)
            if should_exit:
                break
    finally:
        if engine and engine.is_running:
            engine.shutdown()
        logger.info("ARIA CLI session ended.")
