"""
Centralized Logging Utility for ARIA.
Provides styled console output and file logging.
"""

import logging
import os
import sys
from typing import Optional


def setup_logger(
    name: str = "aria",
    level: str = "INFO",
    log_file: Optional[str] = None,
    console: bool = True
) -> logging.Logger:
    """
    Configures and returns a logger instance.
    
    :param name: Logger name.
    :param level: Logging level (e.g. 'DEBUG', 'INFO', 'WARNING', 'ERROR').
    :param log_file: Optional path to a file where logs should be written.
    :param console: Whether to output logs to standard stdout.
    """
    logger = logging.getLogger(name)
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Avoid duplicate handlers if already setup
    if logger.handlers:
        return logger

    # Log format string
    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    date_fmt = "%Y-%m-%d %H:%M:%S"

    # Console Handler
    if console:
        try:
            import colorlog
            console_formatter = colorlog.ColoredFormatter(
                "%(log_color)s%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                datefmt=date_fmt,
                log_colors={
                    'DEBUG':    'cyan',
                    'INFO':     'green',
                    'WARNING':  'yellow',
                    'ERROR':    'red',
                    'CRITICAL': 'bold_red',
                }
            )
        except ImportError:
            console_formatter = logging.Formatter(fmt, datefmt=date_fmt)
            
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(log_level)
        logger.addHandler(console_handler)

    # File Handler
    if log_file:
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
            
        file_formatter = logging.Formatter(fmt, datefmt=date_fmt)
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(file_formatter)
        file_handler.setLevel(log_level)
        logger.addHandler(file_handler)

    return logger


def get_logger(name: str = "aria") -> logging.Logger:
    """
    Retrieve an existing logger or root aria logger.
    """
    return logging.getLogger(name)
