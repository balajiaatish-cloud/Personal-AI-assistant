import { Ollama } from "ollama";
import { AIProvider } from "./provider";
import { Message } from "../memory";
import { formatError } from "../utils";
import { Logger } from "../logger/logger";
import { ConfigManager } from "../config";

export class OllamaProvider implements AIProvider {
  private ollama: Ollama;
  private modelName: string;

  constructor() {
    const config = new ConfigManager().getSettings();
    this.ollama = new Ollama({
      host: config.host || process.env.OLLAMA_HOST || "http://localhost:11434",
    });
    this.modelName = config.modelName || "gemma4:e2b";
  }

  async chat(prompt: string, history?: Message[]): Promise<string> {
    const messages: { role: string; content: string }[] = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    } else {
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    try {
      const response = await this.ollama.chat({
        model: this.modelName,
        messages: messages,
      });

      return response.message.content;
    } catch (error: any) {
      Logger.error(`Ollama API call failed with detailed error:\n${formatError(error)}`);
      throw error;
    }
  }
}
