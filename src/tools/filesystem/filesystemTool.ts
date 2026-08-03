import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";
import fs from "fs/promises";
import path from "path";
import { Logger } from "../../logger/logger";

export interface FileSystemInput {
  action:
    | "readFile"
    | "writeFile"
    | "createFile"
    | "deleteFile"
    | "copyFile"
    | "moveFile"
    | "renameFile"
    | "searchFiles"
    | "fileMetadata"
    | "listDirectory"
    | "directoryTree"
    | "searchFolders"
    | "directoryStats";
  targetPath?: string;
  destinationPath?: string;
  content?: string;
  query?: string;
}

export class FileSystemTool implements Tool<FileSystemInput, unknown> {
  public readonly name = "filesystem";
  public readonly description = "Accesses, inspects, and modifies files and directories inside the project workspace. Actions include read/write/create/delete/copy/move/rename files, recursive directory tree lists, searching files/folders, and directory stats.";
  public readonly category = "system";
  public readonly permissionLevel = "dangerous" as const;
  public readonly inputSchema = {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "readFile",
          "writeFile",
          "createFile",
          "deleteFile",
          "copyFile",
          "moveFile",
          "renameFile",
          "searchFiles",
          "fileMetadata",
          "listDirectory",
          "directoryTree",
          "searchFolders",
          "directoryStats",
        ],
        description: "The filesystem action to perform."
      },
      targetPath: { type: "string", description: "The path of the target file or folder (relative to workspace root)." },
      destinationPath: { type: "string", description: "The destination path (required for copyFile, moveFile, renameFile)." },
      content: { type: "string", description: "The content to write (required for writeFile, createFile)." },
      query: { type: "string", description: "The search keyword (required for searchFiles, searchFolders)." }
    },
    required: ["action"]
  };

  public async execute(args: FileSystemInput, context: ToolContext): Promise<ToolResult<unknown>> {
    if (!args || typeof args !== "object") {
      return {
        success: false,
        error: {
          code: "InvalidParameters",
          message: "Arguments must be a valid key-value object."
        }
      };
    }

    const { action, targetPath, destinationPath, content, query } = args;
    const workspaceRoot = path.resolve(process.cwd());

    // 1. Resolve and validate target path
    let resolvedTargetPath = "";
    if (targetPath) {
      const validated = this.resolveAndValidatePath(targetPath, workspaceRoot);
      if (!validated) {
        return {
          success: false,
          error: {
            code: "AccessDenied",
            message: `Access Denied: Target path "${targetPath}" resolves outside the workspace.`
          }
        };
      }
      resolvedTargetPath = validated;
    } else if (
      action !== "searchFiles" &&
      action !== "searchFolders" &&
      action !== "directoryTree" &&
      action !== "directoryStats"
    ) {
      return {
        success: false,
        error: {
          code: "MissingParameters",
          message: `Parameter "targetPath" is required for action "${action}".`
        }
      };
    } else {
      // Fallback target for workspace level scans
      resolvedTargetPath = workspaceRoot;
    }

    // 2. Resolve and validate destination path
    let resolvedDestPath = "";
    if (destinationPath) {
      const validated = this.resolveAndValidatePath(destinationPath, workspaceRoot);
      if (!validated) {
        return {
          success: false,
          error: {
            code: "AccessDenied",
            message: `Access Denied: Destination path "${destinationPath}" resolves outside the workspace.`
          }
        };
      }
      resolvedDestPath = validated;
    } else if (action === "copyFile" || action === "moveFile" || action === "renameFile") {
      return {
        success: false,
        error: {
          code: "MissingParameters",
          message: `Parameter "destinationPath" is required for action "${action}".`
        }
      };
    }

    // 3. Perform actions
    try {
      switch (action) {
        case "readFile": {
          const stats = await fs.stat(resolvedTargetPath);
          if (!stats.isFile()) {
            return {
              success: false,
              error: {
                code: "NotAFile",
                message: `Path "${targetPath}" is a directory, not a file.`
              }
            };
          }

          // Safety check: max 1MB
          const MAX_SIZE = 1024 * 1024;
          if (stats.size > MAX_SIZE) {
            return {
              success: false,
              error: {
                code: "FileTooLarge",
                message: `File exceeds safe reading limit of 1MB (Size: ${stats.size} bytes).`
              }
            };
          }

          const fileContent = await fs.readFile(resolvedTargetPath, "utf-8");
          return {
            success: true,
            data: fileContent,
            message: `Successfully read file content.`,
          };
        }

        case "writeFile": {
          await fs.writeFile(resolvedTargetPath, content || "", "utf-8");
          return {
            success: true,
            message: `Successfully wrote file: "${targetPath}"`
          };
        }

        case "createFile": {
          await fs.mkdir(path.dirname(resolvedTargetPath), { recursive: true });
          await fs.writeFile(resolvedTargetPath, content || "", "utf-8");
          return {
            success: true,
            message: `Successfully created file: "${targetPath}"`
          };
        }

        case "deleteFile": {
          await fs.rm(resolvedTargetPath, { recursive: true, force: true });
          return {
            success: true,
            message: `Successfully deleted path: "${targetPath}"`
          };
        }

        case "copyFile": {
          await fs.mkdir(path.dirname(resolvedDestPath), { recursive: true });
          await fs.cp(resolvedTargetPath, resolvedDestPath, { recursive: true });
          return {
            success: true,
            message: `Successfully copied "${targetPath}" to "${destinationPath}"`
          };
        }

        case "moveFile":
        case "renameFile": {
          await fs.mkdir(path.dirname(resolvedDestPath), { recursive: true });
          await fs.rename(resolvedTargetPath, resolvedDestPath);
          return {
            success: true,
            message: `Successfully moved/renamed "${targetPath}" to "${destinationPath}"`
          };
        }

        case "fileMetadata": {
          const stats = await fs.stat(resolvedTargetPath);
          const meta = {
            name: path.basename(resolvedTargetPath),
            extension: path.extname(resolvedTargetPath),
            sizeBytes: stats.size,
            sizeFormatted: (stats.size / 1024).toFixed(2) + " KB",
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
          };
          return {
            success: true,
            data: meta,
            message: `Successfully fetched metadata for "${targetPath}"`
          };
        }

        case "listDirectory": {
          const files = await fs.readdir(resolvedTargetPath, { withFileTypes: true });
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

        case "directoryTree": {
          const treeString = await this.buildTree(resolvedTargetPath, "", workspaceRoot);
          return {
            success: true,
            data: treeString,
            message: `Successfully constructed tree view for "${targetPath || "."}"`
          };
        }

        case "searchFiles": {
          if (!query) {
            return {
              success: false,
              error: {
                code: "MissingParameters",
                message: "Parameter 'query' is required for searchFiles."
              }
            };
          }
          const matches = await this.findFiles(resolvedTargetPath, query, workspaceRoot);
          return {
            success: true,
            data: matches,
            message: `Found ${matches.length} files matching "${query}"`
          };
        }

        case "searchFolders": {
          if (!query) {
            return {
              success: false,
              error: {
                code: "MissingParameters",
                message: "Parameter 'query' is required for searchFolders."
              }
            };
          }
          const matches = await this.findFolders(resolvedTargetPath, query, workspaceRoot);
          return {
            success: true,
            data: matches,
            message: `Found ${matches.length} directories matching "${query}"`
          };
        }

        case "directoryStats": {
          const stats = await this.getDirStats(resolvedTargetPath);
          const readableSize = (stats.byteSize / (1024 * 1024)).toFixed(2) + " MB";
          return {
            success: true,
            data: {
              fileCount: stats.fileCount,
              totalBytes: stats.byteSize,
              sizeFormatted: readableSize
            },
            message: `Retrieved stats for "${targetPath || "."}": ${stats.fileCount} files, ${readableSize}`
          };
        }

        default:
          return {
            success: false,
            error: {
              code: "InvalidAction",
              message: `Unknown action: "${action}"`
            }
          };
      }
    } catch (err: any) {
      Logger.error(`FileSystemTool error running action "${action}": ${err.message}`);
      return {
        success: false,
        error: {
          code: err.code || "FileSystemError",
          message: err.message
        }
      };
    }
  }

  private resolveAndValidatePath(target: string, workspaceRoot: string): string | null {
    const resolved = path.resolve(workspaceRoot, target);
    const relative = path.relative(workspaceRoot, resolved);
    const isOutside = relative.startsWith("..") || path.isAbsolute(relative);
    return isOutside ? null : resolved;
  }

  private async buildTree(dir: string, prefix = "", workspaceRoot: string): Promise<string> {
    let tree = "";
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name === "node_modules" || file.name === ".git" || file.name === "dist") {
          continue;
        }
        const isLast = i === files.length - 1;
        const marker = isLast ? "└── " : "├── ";

        tree += `${prefix}${marker}${file.name}${file.isDirectory() ? "/" : ""}\n`;

        if (file.isDirectory()) {
          const newPrefix = prefix + (isLast ? "    " : "│   ");
          tree += await this.buildTree(path.join(dir, file.name), newPrefix, workspaceRoot);
        }
      }
    } catch {}
    return tree;
  }

  private async findFiles(dir: string, query: string, workspaceRoot: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.name === "node_modules" || file.name === ".git" || file.name === "dist") continue;
        const fullPath = path.join(dir, file.name);
        const relative = path.relative(workspaceRoot, fullPath);
        if (file.isDirectory()) {
          results.push(...(await this.findFiles(fullPath, query, workspaceRoot)));
        } else if (file.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(relative);
        }
      }
    } catch {}
    return results;
  }

  private async findFolders(dir: string, query: string, workspaceRoot: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.name === "node_modules" || file.name === ".git" || file.name === "dist") continue;
        const fullPath = path.join(dir, file.name);
        const relative = path.relative(workspaceRoot, fullPath);
        if (file.isDirectory()) {
          if (file.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(relative);
          }
          results.push(...(await this.findFolders(fullPath, query, workspaceRoot)));
        }
      }
    } catch {}
    return results;
  }

  private async getDirStats(dir: string): Promise<{ fileCount: number; byteSize: number }> {
    let fileCount = 0;
    let byteSize = 0;
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.name === "node_modules" || file.name === ".git" || file.name === "dist") continue;
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          const sub = await this.getDirStats(fullPath);
          fileCount += sub.fileCount;
          byteSize += sub.byteSize;
        } else {
          fileCount++;
          try {
            const stats = await fs.stat(fullPath);
            byteSize += stats.size;
          } catch {}
        }
      }
    } catch {}
    return { fileCount, byteSize };
  }
}
