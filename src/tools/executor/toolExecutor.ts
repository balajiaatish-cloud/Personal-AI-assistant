import { ToolRegistry } from "../base/registry";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";
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
  public async execute(toolName: string, args: unknown, context: ToolContext): Promise<ToolResult<unknown>> {
    const startTime = Date.now();
    const tool = this.registry.getTool(toolName);

    if (!tool) {
      const msg = `Tool "${toolName}" is not registered in the system.`;
      Logger.warn(`Tool execution failed: ${msg}`);
      return {
        success: false,
        error: {
          code: "ToolNotFound",
          message: msg,
        },
      };
    }

    try {
      Logger.info(`Tool "${toolName}" started with arguments: ${JSON.stringify(args)}`);
      const result = await tool.execute(args, context);
      const duration = Date.now() - startTime;

      if (result.success) {
        Logger.info(`Tool "${toolName}" executed successfully in ${duration}ms. Result: ${JSON.stringify(result.data)}`);
      } else {
        const errDetail = result.error ? `${result.error.code}: ${result.error.message}` : result.message;
        Logger.warn(`Tool "${toolName}" failed in ${duration}ms: ${errDetail}`);
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || String(error);
      Logger.error(`Exception during execution of tool "${toolName}" in ${duration}ms: ${errorMessage}`);
      
      return {
        success: false,
        error: {
          code: "ExecutionException",
          message: errorMessage,
        },
      };
    }
  }
}
