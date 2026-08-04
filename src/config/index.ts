import dotenv from "dotenv";
import path from "path";
dotenv.config();

export interface MemorySettings {
  directory: string;
  filename: string;
  autosave: boolean;
  maxHistory: number;
}

export interface SearchSettings {
  provider: string;
  apiKey?: string;
  cx?: string;
}

export interface WeatherSettings {
  provider: string;
  apiKey?: string;
}

export interface ContextSettings {
  maxHistoryMessages: number;
  strategy: "discard" | "summarize";
  summarizeThreshold: number;
}

export interface ModelOptions {
  numPredict?: number;
  numCtx?: number;
  stop?: string[];
  promptSnapshot?: boolean;
}

export interface Settings {
  modelProvider: string;
  modelName: string;
  temperature: number;
  host?: string;
  memory: MemorySettings;
  search: SearchSettings;
  weather: WeatherSettings;
  debug: boolean;
  context: ContextSettings;
  options: ModelOptions;
}

export class ConfigManager {
  private settings: Settings;

  constructor() {
    this.settings = {
      modelProvider: process.env.MODEL_PROVIDER || "ollama",
      modelName: process.env.MODEL_NAME || "gemma4:e2b",
      temperature: parseFloat(process.env.MODEL_TEMPERATURE || "0.2"), // Set default to 0.2 for tool calling stability
      host: process.env.OLLAMA_HOST || "http://localhost:11434",
      memory: {
        directory: process.env.MEMORY_DIR || "./memory",
        filename: process.env.CONVERSATIONS_FILE || "conversations.json",
        autosave: true,
        maxHistory: 100,
      },
      search: {
        provider: process.env.SEARCH_PROVIDER || "mock",
        apiKey: process.env.SEARCH_API_KEY || "",
        cx: process.env.GOOGLE_CX || "",
      },
      weather: {
        provider: process.env.WEATHER_PROVIDER || "mock",
        apiKey: process.env.WEATHER_API_KEY || "",
      },
      debug: process.env.ARIA_LOG_LEVEL?.toUpperCase() === "DEBUG" || process.env.DEBUG === "true" || false,
      context: {
        maxHistoryMessages: parseInt(process.env.MAX_HISTORY_MESSAGES || "20", 10),
        strategy: (process.env.CONTEXT_STRATEGY || "discard") as "discard" | "summarize",
        summarizeThreshold: parseInt(process.env.SUMMARIZE_THRESHOLD || "30", 10),
      },
      options: {
        numPredict: process.env.MODEL_NUM_PREDICT ? parseInt(process.env.MODEL_NUM_PREDICT, 10) : 2048,
        numCtx: process.env.MODEL_NUM_CTX ? parseInt(process.env.MODEL_NUM_CTX, 10) : 8192,
        stop: process.env.MODEL_STOP_SEQUENCES ? process.env.MODEL_STOP_SEQUENCES.split(",") : undefined,
        promptSnapshot: process.env.MODEL_PROMPT_SNAPSHOT === "true" || true, // Enable prompt snapshotting by default in debug/options
      },
    };
  }

  public getSettings(): Settings {
    return this.settings;
  }
}


