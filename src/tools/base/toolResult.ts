export interface ToolResult<TOutput = unknown> {
  readonly success: boolean;
  readonly message: string;
  readonly data?: TOutput;
  readonly error?: string;
}
