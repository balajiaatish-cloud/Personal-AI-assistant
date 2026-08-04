import { Message } from "../memory";
import { MemoryManager } from "../memory/services/memoryManager";
import { ConfigManager } from "../config";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt";
import { Logger } from "../logger/logger";

export class ContextManager {
  private memoryManager: MemoryManager;
  private config: ConfigManager;

  constructor(memoryManager: MemoryManager, config: ConfigManager) {
    this.memoryManager = memoryManager;
    this.config = config;
  }

  /**
   * Estimates the token count of a message array.
   */
  public estimateTokens(messages: Message[]): number {
    let charCount = 0;
    for (const msg of messages) {
      charCount += msg.role.length + msg.content.length;
      if (msg.metadata) {
        charCount += JSON.stringify(msg.metadata).length;
      }
    }
    return Math.ceil(charCount / 4);
  }

  /**
   * Constructs the optimized message history list to send to the provider.
   */
  public async buildContext(history: Message[]): Promise<Message[]> {
    const settings = this.config.getSettings();
    const maxHistory = settings.context?.maxHistoryMessages ?? 20;
    const strategy = settings.context?.strategy ?? "discard";
    const summarizeThreshold = settings.context?.summarizeThreshold ?? 30;

    // 1. Retrieve Important memories & construct system prompt
    const facts = await this.memoryManager.getFacts();
    const profile = await this.memoryManager.getProfile();
    const preferences = await this.memoryManager.getPreferences();

    let memoryParts: string[] = [];
    if (facts.length > 0) {
      memoryParts.push(`- Facts about the user/environment:\n  ${facts.map(f => `* ${f}`).join("\n  ")}`);
    }
    if (Object.keys(profile).length > 0) {
      memoryParts.push(`- User Profile:\n  ${Object.entries(profile).map(([k, v]) => `* ${k}: ${JSON.stringify(v)}`).join("\n  ")}`);
    }
    if (Object.keys(preferences).length > 0) {
      memoryParts.push(`- User Preferences:\n  ${Object.entries(preferences).map(([k, v]) => `* ${k}: ${JSON.stringify(v)}`).join("\n  ")}`);
    }

    const memoryPrompt = memoryParts.length > 0 
      ? `\n\nMemory Context (IMPORTANT: Retrieve user preferences and facts from here. Never ignore them):\n${memoryParts.join("\n")}`
      : "";

    const systemMessage: Message = {
      id: "system-prompt-msg",
      role: "system",
      content: `${SYSTEM_PROMPT}${memoryPrompt}`,
      timestamp: new Date().toISOString(),
    };

    // 2. Separate historical messages from the current ongoing tool interaction.
    // The current tool interaction starts from the last "user" message in the history.
    let lastUserIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }

    let historicalMessages: Message[] = [];
    let currentInteraction: Message[] = [];

    if (lastUserIndex !== -1) {
      historicalMessages = history.slice(0, lastUserIndex);
      currentInteraction = history.slice(lastUserIndex);
    } else {
      historicalMessages = history;
    }

    // 3. Process/Trim the historical messages
    let processedHistory: Message[] = [];

    if (historicalMessages.length <= maxHistory) {
      processedHistory = historicalMessages;
    } else {
      if (strategy === "summarize" && historicalMessages.length >= summarizeThreshold) {
        const discarded = historicalMessages.slice(0, historicalMessages.length - maxHistory);
        const summaryText = this.summarizeMessages(discarded);
        processedHistory = [
          {
            id: "history-summary",
            role: "system",
            content: `Summary of earlier conversation:\n${summaryText}`,
            timestamp: new Date().toISOString(),
          },
          ...historicalMessages.slice(-maxHistory)
        ];
      } else {
        // Default: "discard" sliding window
        processedHistory = historicalMessages.slice(-maxHistory);
      }
    }

    // Combine system message, processed history, and current interaction
    const finalContext = [systemMessage, ...processedHistory, ...currentInteraction];

    if (settings.debug) {
      const originalCount = history.length;
      const optimizedCount = finalContext.length;
      const toolMsgCount = finalContext.filter(m => m.role === "tool").length;
      const totalChars = finalContext.reduce((acc, m) => acc + m.role.length + m.content.length + (m.metadata ? JSON.stringify(m.metadata).length : 0), 0);
      const estTokens = Math.ceil(totalChars / 4);

      Logger.debug(`[ContextManager] Optimization Statistics:`);
      Logger.debug(`  - Original conversation history count: ${originalCount} messages`);
      Logger.debug(`  - Trimmed context history count: ${optimizedCount} messages`);
      Logger.debug(`  - Tool messages in context: ${toolMsgCount}`);
      Logger.debug(`  - Estimated context size: ${totalChars} chars (~${estTokens} tokens)`);
    }

    return finalContext;
  }

  private summarizeMessages(messages: Message[]): string {
    const summaryParts: string[] = [];
    for (const msg of messages) {
      if (msg.role === "user") {
        summaryParts.push(`User asked: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`);
      } else if (msg.role === "assistant" && msg.content) {
        summaryParts.push(`Assistant replied: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`);
      }
    }
    return summaryParts.join("\n");
  }
}
