import { Ollama } from "ollama";
import { AIProvider, ProviderResponse } from "./provider";
import { Message } from "../memory";
import { Tool } from "../tools/base/tool";
import { formatError } from "../utils";
import { Logger } from "../logger/logger";
import { ConfigManager } from "../config";
import fs from "fs/promises";
import path from "path";

export class OllamaProvider implements AIProvider {
  private ollama: Ollama;
  private modelName: string;
  private temperature: number;
  private numPredict?: number;
  private numCtx?: number;
  private stopSequences?: string[];
  private debugEnabled: boolean;
  private promptSnapshotEnabled: boolean;

  constructor() {
    const config = new ConfigManager().getSettings();
    this.ollama = new Ollama({
      host: config.host || process.env.OLLAMA_HOST || "http://localhost:11434",
    });
    this.modelName = config.modelName || "gemma4:e2b";
    this.temperature = config.temperature;
    this.numPredict = config.options?.numPredict;
    this.numCtx = config.options?.numCtx;
    this.stopSequences = config.options?.stop;
    this.debugEnabled = config.debug;
    this.promptSnapshotEnabled = config.options?.promptSnapshot ?? true;
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

    // Optional Prompt Snapshotting in Debug mode
    if (this.debugEnabled && this.promptSnapshotEnabled) {
      try {
        const snapshotPath = path.resolve("./logs/prompt_snapshot.json");
        await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
        const snapshotData = {
          timestamp: new Date().toISOString(),
          model: this.modelName,
          messages: messages,
          tools: ollamaTools,
          options: {
            temperature: this.temperature,
            num_ctx: this.numCtx,
            num_predict: this.numPredict,
            stop: this.stopSequences,
          }
        };
        await fs.writeFile(snapshotPath, JSON.stringify(snapshotData, null, 2), "utf-8");
        Logger.debug(`[OllamaProvider] Saved prompt snapshot to: ${snapshotPath}`);
      } catch (err: any) {
        Logger.warn(`[OllamaProvider] Failed to save prompt snapshot: ${err.message}`);
      }
    }

    if (this.debugEnabled) {
      const totalMessages = messages.length;
      const toolMessages = messages.filter(m => m.role === "tool").length;
      const promptChars = messages.reduce((acc, m) => acc + m.content.length + m.role.length, 0);
      const estTokens = Math.ceil(promptChars / 4);

      const requestPayload = {
        model: this.modelName,
        messages: messages,
        tools: ollamaTools,
        options: {
          temperature: this.temperature,
          num_predict: this.numPredict,
          num_ctx: this.numCtx,
          stop: this.stopSequences,
        }
      };
      const finalPayloadSize = JSON.stringify(requestPayload).length;

      Logger.debug(`[OllamaProvider] Request Statistics:`);
      Logger.debug(`  - Total messages: ${totalMessages}`);
      Logger.debug(`  - Tool messages: ${toolMessages}`);
      Logger.debug(`  - Estimated prompt size: ${promptChars} characters (~${estTokens} tokens)`);
      Logger.debug(`  - Final request payload size: ${finalPayloadSize} bytes`);
      Logger.debug(`  - Registered tools: ${tools ? tools.map(t => t.name).join(", ") : "none"}`);
      Logger.debug(`  - Tools sent to model: ${ollamaTools ? JSON.stringify(ollamaTools.map(ot => ot.function.name)) : "none"}`);
    }

    const startTime = Date.now();
    try {
      const response = await this.ollama.chat({
        model: this.modelName,
        messages: messages,
        tools: ollamaTools,
        options: {
          temperature: this.temperature,
          num_predict: this.numPredict,
          num_ctx: this.numCtx,
          stop: this.stopSequences,
        }
      });

      const duration = Date.now() - startTime;

      if (this.debugEnabled) {
        Logger.debug(`[OllamaProvider] Request duration: ${duration}ms`);
        if (response.message.tool_calls && response.message.tool_calls.length > 0) {
          Logger.debug(`[OllamaProvider] Returned tool calls: ${JSON.stringify(response.message.tool_calls, null, 2)}`);
        } else {
          Logger.debug(`[OllamaProvider] Returned content: "${response.message.content?.substring(0, 100)}${(response.message.content?.length || 0) > 100 ? '...' : ''}"`);
        }
      }

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

