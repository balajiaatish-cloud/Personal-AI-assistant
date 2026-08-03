import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";
import fs from "fs/promises";
import path from "path";

export interface FileSystemInput {
  action: "listDirectory" | "fileExists" | "readFile";
  targetPath: string;
}

export class FileSystemTool implements Tool<FileSystemInput, unknown> {
  public readonly name = "filesystem";
  public readonly description = "Read-only access to list directories, check file existence, and read text files within the project workspace.";
  public readonly category = "system";
  public readonly inputSchema = {
    type: "object",
    properties: {
      action: { type: "string", enum: ["listDirectory", "fileExists", "readFile"] },
      targetPath: { type: "string" }
    },
    required: ["action", "targetPath"]
  };

  public async execute(args: FileSystemInput, context: ToolContext): Promise<ToolResult<unknown>> {
    // 1. Parameter Validation
    if (!args || typeof args !== "object") {
      return {
        success: false,
        message: "Invalid input arguments. Expected an object with action and targetPath.",
        error: "InvalidParameters",
      };
    }

    const { action, targetPath } = args;

    if (!action || !targetPath) {
      return {
        success: false,
        message: "Missing required parameters: action, targetPath",
        error: "MissingParameters",
      };
    }

    // 2. Security Boundaries Enforced
    const workspaceRoot = path.resolve(process.cwd());
    const resolvedPath = path.resolve(workspaceRoot, targetPath);
    
    const relative = path.relative(workspaceRoot, resolvedPath);
    const isOutside = relative.startsWith("..") || path.isAbsolute(relative);

    if (isOutside) {
      return {
        success: false,
        message: `Access Denied: Path is outside the project workspace root.`,
        error: "AccessDenied",
      };
    }

    // 3. Execution (Read-Only)
    try {
      switch (action) {
        case "listDirectory": {
          const files = await fs.readdir(resolvedPath, { withFileTypes: true });
          const list = files.map((file) => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            isFile: file.isFile(),
          }));
          return {
            success: true,
            data: list,
            message: `Successfully listed directory contents.`,
          };
        }
        case "fileExists": {
          try {
            await fs.access(resolvedPath);
            return {
              success: true,
              data: { exists: true },
              message: `Path exists.`,
            };
          } catch {
            return {
              success: true, // Checking existence itself succeeded
              data: { exists: false },
              message: `Path does not exist.`,
            };
          }
        }
        case "readFile": {
          const stats = await fs.stat(resolvedPath);
          if (!stats.isFile()) {
            return {
              success: false,
              message: `Path is not a file.`,
              error: "NotAFile",
            };
          }

          // Safety check: Avoid reading huge files into memory (max 1MB)
          const MAX_SIZE = 1 * 1024 * 1024;
          if (stats.size > MAX_SIZE) {
            return {
              success: false,
              message: `File exceeds safe reading limit of 1MB (Size: ${stats.size} bytes).`,
              error: "FileTooLarge",
            };
          }

          const content = await fs.readFile(resolvedPath, "utf-8");
          return {
            success: true,
            data: content,
            message: `Successfully read file content.`,
          };
        }
        default:
          return {
            success: false,
            message: `Unsupported action "${action}". Supported actions: listDirectory, fileExists, readFile.`,
            error: "UnsupportedAction",
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `FileSystem operation failed: ${error.message}`,
        error: error.code || "FileSystemError",
      };
    }
  }
}
