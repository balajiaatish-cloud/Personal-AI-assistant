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
  memory: MemorySettings;
}

export class ConfigManager {
  private settings: Settings = {
    modelProvider: "gemini",
    modelName: "gemini-3.6-flash",
    temperature: 0.7,
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

