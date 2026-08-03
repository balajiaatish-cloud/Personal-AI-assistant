import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";

export class DateTool implements Tool<unknown, string> {
  public readonly name = "date";
  public readonly description = "Retrieves the current system date.";
  public readonly category = "utility";
  public readonly inputSchema = {
    type: "object",
    properties: {}
  };

  public async execute(args: unknown, context: ToolContext): Promise<ToolResult<string>> {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    return {
      success: true,
      data: dateStr,
      message: `Current date: ${dateStr}`,
    };
  }
}
