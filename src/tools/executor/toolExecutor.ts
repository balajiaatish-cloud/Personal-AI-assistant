import { ToolRegistry } from "../base/registry";
import { ToolResult } from "../base/toolResult";
import { Logger } from "../../logger/logger";

export class ToolExecutor {
  private readonly registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  /**
   * Executes a registered tool by its name with the provided arguments.
   * Catches all exceptions and guarantees return of a standardized ToolResult.
   */
  public async execute(toolName: string, args: unknown): Promise<ToolResult<unknown>> {
    const startTime = Date.now();
    const tool = this.registry.getTool(toolName);

    if (!tool) {
      const message = `Tool execution failed: Tool not found`;
      Logger.warn(`${message} ("${toolName}")`);
      return {
        success: false,
        message,
        error: `Tool "${toolName}" is not registered in the system.`,
      };
    }

    try {
      const result = await tool.execute(args);
      const duration = Date.now() - startTime;

      if (result.success) {
        Logger.info(`Tool "${toolName}" executed successfully in ${duration}ms.`);
      } else {
        Logger.warn(`Tool "${toolName}" returned failure in ${duration}ms: ${result.message}`);
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || String(error);
      Logger.error(`Exception during execution of tool "${toolName}" in ${duration}ms: ${errorMessage}`);
      
      return {
        success: false,
        message: `Exception during execution of tool "${toolName}"`,
        error: errorMessage,
      };
    }
  }
}
