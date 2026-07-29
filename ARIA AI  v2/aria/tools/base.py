"""
Base interfaces and registry for ARIA tools.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Type


class BaseTool(ABC):
    """
    Abstract Base Class for tools integrated into ARIA.
    """

    name: str = "base_tool"
    description: str = "Base tool description"

    @abstractmethod
    def execute(self, **kwargs: Any) -> Any:
        """
        Execute tool functionality.
        """
        pass


class ToolRegistry:
    """
    Central registry for dynamic tool registration and discovery.
    """

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> BaseTool:
        if name not in self._tools:
            raise KeyError(f"Tool '{name}' is not registered.")
        return self._tools[name]

    def list_tools(self) -> Dict[str, str]:
        return {name: tool.description for name, tool in self._tools.items()}
