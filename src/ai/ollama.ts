import { Ollama } from "ollama";
import { AIProvider, ProviderResponse } from "./provider";
import { Message } from "../memory";
import { Tool } from "../tools/base/tool";
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

  async chat(prompt: string, history?: Message[], tools?: Tool[]): Promise<ProviderResponse> {
    const messages: any[] = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant" || msg.role === "tool" || msg.role === "system") {
          const formattedMsg: any = {
            role: msg.role,
            content: msg.content,
          };
          
          if (msg.role === "assistant" && msg.metadata?.toolCalls) {
            formattedMsg.tool_calls = msg.metadata.toolCalls.map((tc: any) => ({
              function: {
                name: tc.name,
                arguments: tc.arguments,
              }
            }));
          }
          
          if (msg.role === "tool") {
            formattedMsg.tool_name = msg.metadata?.toolName;
          }
          
          messages.push(formattedMsg);
        }
      }
    } else {
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    const ollamaTools = tools && tools.length > 0
      ? tools.map(t => ({
          type: "function" as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema || {
              type: "object",
              properties: {},
            }
          }
        }))
      : undefined;

    try {
      const response = await this.ollama.chat({
        model: this.modelName,
        messages: messages,
        tools: ollamaTools,
      });

      if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        const toolCalls = response.message.tool_calls.map((tc) => ({
          name: tc.function.name,
          arguments: tc.function.arguments,
        }));
        
        return {
          text: response.message.content || "",
          toolCalls,
        };
      }

      return {
        text: response.message.content,
      };
    } catch (error: any) {
      Logger.error(`Ollama API call failed with detailed error:\n${formatError(error)}`);
      throw error;
    }
  }
}
