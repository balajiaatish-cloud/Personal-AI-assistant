import { ToolRegistry } from "./base/registry";
import { ToolExecutor } from "./executor/toolExecutor";
import { ToolContext } from "./base/toolContext";
import { ToolResult } from "./base/toolResult";

export class ToolManager {
  private readonly registry: ToolRegistry;
  private readonly executor: ToolExecutor;

  constructor(registry: ToolRegistry, executor: ToolExecutor) {
    this.registry = registry;
    this.executor = executor;
  }

  public getRegistry(): ToolRegistry {
    return this.registry;
  }

  public getExecutor(): ToolExecutor {
    return this.executor;
  }

  /**
   * Locates, validates arguments, and executes a registered tool.
   */
  public async execute(toolName: string, args: unknown, context: ToolContext): Promise<ToolResult<unknown>> {
    // 1. Locate tool
    const tool = this.registry.getTool(toolName);
    if (!tool) {
      return {
        success: false,
        message: `Tool "${toolName}" not found.`,
        error: {
          code: "ToolNotFound",
          message: `Tool "${toolName}" is not registered in the system.`,
        },
      };
    }

    // 2. Validate arguments against its inputSchema (if present)
    if (tool.inputSchema) {
      const validationError = this.validateArgs(args, tool.inputSchema);
      if (validationError) {
        return {
          success: false,
          message: `Validation failed for tool "${toolName}" arguments: ${validationError}`,
          error: {
            code: "ValidationError",
            message: validationError,
          },
        };
      }
    }

    // 3. Execute tool via ToolExecutor, catching execution errors
    return this.executor.execute(toolName, args, context);
  }

  private validateArgs(args: any, schema: any): string | null {
    if (!schema) return null;
    if (schema.type === "object") {
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        return "Arguments must be a key-value object.";
      }
      if (schema.required && Array.isArray(schema.required)) {
        for (const reqField of schema.required) {
          if (args[reqField] === undefined) {
            return `Missing required field: "${reqField}"`;
          }
        }
      }
      if (schema.properties) {
        for (const [key, value] of Object.entries(args)) {
          const propSchema = schema.properties[key];
          if (propSchema) {
            if (propSchema.type) {
              const actualType = typeof value;
              if (propSchema.type === "array") {
                if (!Array.isArray(value)) {
                  return `Field "${key}" must be an array.`;
                }
              } else if (propSchema.type === "number") {
                if (actualType !== "number" || isNaN(value as number)) {
                  return `Field "${key}" must be a number.`;
                }
              } else if (actualType !== propSchema.type) {
                return `Field "${key}" must be of type ${propSchema.type}, got ${actualType}.`;
              }
              if (propSchema.enum && Array.isArray(propSchema.enum)) {
                if (!propSchema.enum.includes(value)) {
                  return `Field "${key}" must be one of [${propSchema.enum.join(", ")}], got "${value}".`;
                }
              }
            }
          }
        }
      }
    }
    return null;
  }
}
