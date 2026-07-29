import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import os from "os";

export interface SystemOutput {
  platform: string;
  arch: string;
  nodeVersion: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  cpuCount: number;
  totalMemoryBytes: number;
  totalMemoryGB: string;
  freeMemoryBytes: number;
  freeMemoryGB: string;
  usedMemoryGB: string;
}

export class SystemTool implements Tool<unknown, SystemOutput> {
  public readonly name = "system";
  public readonly description = "Retrieves basic runtime information about the system.";
  public readonly category = "system";

  public async execute(): Promise<ToolResult<SystemOutput>> {
    const uptime = os.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const systemInfo: SystemOutput = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptimeSeconds: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      cpuCount: os.cpus().length,
      totalMemoryBytes: totalMem,
      totalMemoryGB: (totalMem / (1024 ** 3)).toFixed(2) + " GB",
      freeMemoryBytes: freeMem,
      freeMemoryGB: (freeMem / (1024 ** 3)).toFixed(2) + " GB",
      usedMemoryGB: ((totalMem - freeMem) / (1024 ** 3)).toFixed(2) + " GB",
    };

    return {
      success: true,
      data: systemInfo,
      message: "Successfully retrieved system runtime information.",
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(" ");
  }
}
