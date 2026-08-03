import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";
import os from "os";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { Logger } from "../../logger/logger";

const execAsync = promisify(exec);

export interface SystemOutput {
  platform: string;
  osRelease: string;
  osType: string;
  arch: string;
  hostname: string;
  nodeVersion: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  cpu: {
    model: string;
    speedMhz: number;
    count: number;
  };
  memory: {
    totalBytes: number;
    totalGB: string;
    freeBytes: number;
    freeGB: string;
    usedGB: string;
    usagePercent: string;
  };
  disk?: {
    totalGB: string;
    freeGB: string;
    usedGB: string;
    usagePercent: string;
  };
  battery: string;
  network: { interface: string; address: string }[];
}

export class SystemTool implements Tool<unknown, SystemOutput> {
  public readonly name = "system";
  public readonly description = "Retrieves detailed information about the system, including CPU model and cores, memory usage percentage, disk space, battery status, network IP addresses, operating system details, and system uptime.";
  public readonly category = "system";
  public readonly permissionLevel = "safe" as const;

  public async execute(args: unknown, context: ToolContext): Promise<ToolResult<SystemOutput>> {
    const uptime = os.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
    const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 0;

    // 1. Gather Disk Stats
    let diskStats: any = undefined;
    try {
      const stats = await fs.statfs(process.cwd());
      const totalDisk = stats.blocks * stats.bsize;
      const freeDisk = stats.bfree * stats.bsize;
      const usedDisk = totalDisk - freeDisk;
      diskStats = {
        totalGB: (totalDisk / (1024 ** 3)).toFixed(2) + " GB",
        freeGB: (freeDisk / (1024 ** 3)).toFixed(2) + " GB",
        usedGB: (usedDisk / (1024 ** 3)).toFixed(2) + " GB",
        usagePercent: ((usedDisk / totalDisk) * 100).toFixed(2) + "%",
      };
    } catch (err: any) {
      Logger.warn(`SystemTool: Failed to retrieve disk space info: ${err.message}`);
    }

    // 2. Gather Battery Info
    let batteryStatus = "AC Power / Desktop (No Battery Detected)";
    try {
      if (os.platform() === "win32") {
        const { stdout } = await execAsync("wmic path Win32_Battery get EstimatedChargeRemaining, BatteryStatus /value");
        if (stdout.trim()) {
          const remainingMatch = stdout.match(/EstimatedChargeRemaining=(\d+)/);
          const statusMatch = stdout.match(/BatteryStatus=(\d+)/);
          const remaining = remainingMatch ? `${remainingMatch[1]}%` : "Unknown";
          const statusVal = statusMatch ? Number(statusMatch[1]) : 1;
          const statusStr = statusVal === 3 ? "Fully Charged" : statusVal === 6 ? "Charging" : "Discharging";
          batteryStatus = `Battery: ${remaining} (${statusStr})`;
        }
      } else if (os.platform() === "darwin") {
        const { stdout } = await execAsync("pmset -g batt");
        const match = stdout.match(/(\d+)%;\s+(\w+);/);
        if (match) {
          batteryStatus = `Battery: ${match[1]}% (${match[2]})`;
        }
      } else if (os.platform() === "linux") {
        try {
          const capacity = await fs.readFile("/sys/class/power_supply/BAT0/capacity", "utf-8");
          const status = await fs.readFile("/sys/class/power_supply/BAT0/status", "utf-8");
          batteryStatus = `Battery: ${capacity.trim()}% (${status.trim()})`;
        } catch {}
      }
    } catch {
      // Ignored: fallback battery status remains
    }

    // 3. Gather Network Interfaces Info
    const interfaces = os.networkInterfaces();
    const networkInfo: { interface: string; address: string }[] = [];
    for (const [name, info] of Object.entries(interfaces)) {
      if (info) {
        for (const ip of info) {
          if (!ip.internal && ip.family === "IPv4") {
            networkInfo.push({ interface: name, address: ip.address });
          }
        }
      }
    }

    const systemInfo: SystemOutput = {
      platform: os.platform(),
      osRelease: os.release(),
      osType: os.type(),
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptimeSeconds: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      cpu: {
        model: cpuModel,
        speedMhz: cpuSpeed,
        count: cpus.length,
      },
      memory: {
        totalBytes: totalMem,
        totalGB: (totalMem / (1024 ** 3)).toFixed(2) + " GB",
        freeBytes: freeMem,
        freeGB: (freeMem / (1024 ** 3)).toFixed(2) + " GB",
        usedGB: (usedMem / (1024 ** 3)).toFixed(2) + " GB",
        usagePercent: ((usedMem / totalMem) * 100).toFixed(2) + "%",
      },
      disk: diskStats,
      battery: batteryStatus,
      network: networkInfo,
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
