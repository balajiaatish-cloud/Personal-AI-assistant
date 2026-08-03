import { ToolResult } from "./toolResult";
import { ToolContext } from "./toolContext";

export type ToolPermissionLevel = "safe" | "confirmation" | "dangerous";

export interface Tool<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly category?: string;
  readonly inputSchema?: Record<string, unknown>;
  readonly permissionLevel?: ToolPermissionLevel;
  execute(args: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}
