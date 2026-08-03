export interface ToolError {
  code: string;
  message: string;
}

export interface ToolResult<TOutput = unknown> {
  readonly success: boolean;
  readonly data?: TOutput;
  readonly error?: ToolError;
  readonly message?: string;
}
