import { ToolResult } from "./toolResult";
import { ToolContext } from "./toolContext";

export interface Tool<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly category?: string;
  readonly inputSchema?: Record<string, unknown>;
  execute(args: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}
