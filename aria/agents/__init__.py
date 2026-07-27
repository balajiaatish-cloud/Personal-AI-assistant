"""
ARIA Agents Subsystem.
Stub package for multi-agent delegation, planner workflows, and agent execution.
"""

class BaseAgent:
    """
    Abstract interface for autonomous agent implementations.
    """
    def run(self, task: str) -> str:
        raise NotImplementedError
