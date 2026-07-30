export interface MemorySettings {
  directory: string;
  filename: string;
  autosave: boolean;
  maxHistory: number;
}

export interface Settings {
  modelProvider: string;
  modelName: string;
  temperature: number;
  host?: string;
  memory: MemorySettings;
}

export class ConfigManager {
  private settings: Settings = {
    modelProvider: "ollama",
    modelName: "gemma4:e2b",
    temperature: 0.7,
    host: "http://localhost:11434",
    memory: {
      directory: "./memory",
      filename: "conversations.json",
      autosave: true,
      maxHistory: 100,
    },
  };

  public getSettings(): Settings {
    return this.settings;
  }
}

