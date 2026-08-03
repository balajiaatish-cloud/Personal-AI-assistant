import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";

export interface MemoryInput {
  action: "addFact" | "getFacts" | "setPreference" | "getPreference" | "setProfile" | "getProfile";
  fact?: string;
  key?: string;
  value?: any;
  profile?: Record<string, any>;
}

export class MemoryTool implements Tool<MemoryInput, unknown> {
  public readonly name = "memory";
  public readonly description = "Allows storing and retrieving facts, user profiles, and preferences in persistent memory.";
  public readonly category = "memory";
  public readonly inputSchema = {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["addFact", "getFacts", "setPreference", "getPreference", "setProfile", "getProfile"]
      },
      fact: {
        type: "string",
        description: "The fact to save (required for addFact)."
      },
      key: {
        type: "string",
        description: "The preference key (required for setPreference and getPreference)."
      },
      value: {
        type: "string",
        description: "The value to associate with the key (required for setPreference)."
      },
      profile: {
        type: "object",
        description: "The profile object containing user details (required for setProfile)."
      }
    },
    required: ["action"]
  };

  public async execute(args: MemoryInput, context: ToolContext): Promise<ToolResult<unknown>> {
    const { action, fact, key, value, profile } = args;

    try {
      switch (action) {
        case "addFact": {
          if (!fact) {
            return {
              success: false,
              message: "Missing 'fact' parameter for action 'addFact'.",
              error: "MissingParameter",
            };
          }
          await context.memoryManager.addFact(fact);
          return {
            success: true,
            message: `Successfully added fact to global memory: "${fact}"`,
          };
        }
        case "getFacts": {
          const facts = await context.memoryManager.getFacts();
          return {
            success: true,
            data: facts,
            message: `Retrieved ${facts.length} facts from global memory.`,
          };
        }
        case "setPreference": {
          if (!key || value === undefined) {
            return {
              success: false,
              message: "Missing 'key' or 'value' parameter for action 'setPreference'.",
              error: "MissingParameter",
            };
          }
          await context.memoryManager.setPreference(key, value);
          return {
            success: true,
            message: `Successfully set preference "${key}" to "${value}" in global memory.`,
          };
        }
        case "getPreference": {
          if (!key) {
            return {
              success: false,
              message: "Missing 'key' parameter for action 'getPreference'.",
              error: "MissingParameter",
            };
          }
          const preferences = await context.memoryManager.getPreferences();
          const val = preferences[key];
          return {
            success: true,
            data: val,
            message: val !== undefined
              ? `Retrieved preference "${key}": "${val}"`
              : `Preference "${key}" not found.`,
          };
        }
        case "setProfile": {
          if (!profile || typeof profile !== "object") {
            return {
              success: false,
              message: "Missing or invalid 'profile' parameter for action 'setProfile'.",
              error: "MissingParameter",
            };
          }
          await context.memoryManager.setProfile(profile);
          return {
            success: true,
            message: `Successfully updated user profile in global memory.`,
          };
        }
        case "getProfile": {
          const prof = await context.memoryManager.getProfile();
          return {
            success: true,
            data: prof,
            message: `Retrieved user profile from global memory.`,
          };
        }
        default:
          return {
            success: false,
            message: `Unknown memory action: "${action}"`,
            error: "InvalidAction",
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Memory operation failed: ${error.message}`,
        error: "MemoryError",
      };
    }
  }
}
