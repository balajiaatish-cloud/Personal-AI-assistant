import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";

export class TimeTool implements Tool<unknown, string> {
  public readonly name = "time";
  public readonly description = "Retrieves the current system time.";
  public readonly category = "utility";
  public readonly inputSchema = {
    type: "object",
    properties: {}
  };

  public async execute(args: unknown, context: ToolContext): Promise<ToolResult<string>> {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    return {
      success: true,
      data: timeStr,
      message: `Current time: ${timeStr}`,
    };
  }
}
