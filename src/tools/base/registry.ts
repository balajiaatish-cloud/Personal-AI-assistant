import { Tool } from "./tool";
import { Logger } from "../../logger/logger";

export class ToolRegistry {
  private readonly tools: Map<string, Tool<any, any>> = new Map();

  /**
   * Registers a tool in the registry. Prevents duplicate registration.
   */
  public register(tool: Tool<any, any>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool duplicate registration error: A tool named "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
    Logger.info(`Registered tool: ${tool.name} [Category: ${tool.category || "None"}]`);
  }

  /**
   * Unregisters a tool by name.
   */
  public unregister(name: string): boolean {
    if (this.tools.has(name)) {
      this.tools.delete(name);
      Logger.info(`Unregistered tool: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Retrieves a tool by name.
   */
  public getTool(name: string): Tool<any, any> | undefined {
    return this.tools.get(name);
  }

  /**
   * Lists all registered tools.
   */
  public listTools(): Tool<any, any>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Checks if a tool is registered.
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}
