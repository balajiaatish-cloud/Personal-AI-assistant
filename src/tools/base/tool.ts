import { ToolResult } from "./toolResult";

export interface Tool<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly category?: string;
  readonly inputSchema?: Record<string, unknown>;
  execute(args: TInput): Promise<ToolResult<TOutput>>;
}
