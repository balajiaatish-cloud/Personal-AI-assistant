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

export interface Settings {
  modelProvider: string;
  modelName: string;
  temperature: number;
  host?: string;
  memory: MemorySettings;
  search: SearchSettings;
  weather: WeatherSettings;
}

export class ConfigManager {
  private settings: Settings;

  constructor() {
    this.settings = {
      modelProvider: process.env.MODEL_PROVIDER || "ollama",
      modelName: process.env.MODEL_NAME || "gemma4:e2b",
      temperature: parseFloat(process.env.MODEL_TEMPERATURE || "0.7"),
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
    };
  }

  public getSettings(): Settings {
    return this.settings;
  }
}

