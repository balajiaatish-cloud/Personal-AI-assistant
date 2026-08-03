import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";

export interface DateTimeInput {
  action?: "date" | "time" | "iso" | "all";
}

export interface DateTimeOutput {
  date?: string;
  time?: string;
  iso?: string;
}

export class DateTimeTool implements Tool<DateTimeInput, DateTimeOutput> {
  public readonly name = "datetime";
  public readonly description = "Retrieves the current date, time, or ISO timestamp in the system's timezone.";
  public readonly category = "utility";
  public readonly inputSchema = {
    type: "object",
    properties: {
      action: { type: "string", enum: ["date", "time", "iso", "all"] }
    }
  };

  public async execute(args: DateTimeInput | undefined, context: ToolContext): Promise<ToolResult<DateTimeOutput>> {
    const action = args?.action || "all";
    const now = new Date();

    const resultData: DateTimeOutput = {};
    if (action === "date" || action === "all") {
      resultData.date = now.toLocaleDateString();
    }
    if (action === "time" || action === "all") {
      resultData.time = now.toLocaleTimeString();
    }
    if (action === "iso" || action === "all") {
      resultData.iso = now.toISOString();
    }

    let message = "Current system date and time retrieved.";
    if (action === "date") message = `Current date: ${resultData.date}`;
    else if (action === "time") message = `Current time: ${resultData.time}`;
    else if (action === "iso") message = `Current ISO timestamp: ${resultData.iso}`;

    return {
      success: true,
      data: resultData,
      message,
    };
  }
}
