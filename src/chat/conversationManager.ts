import { MemoryManager, Message } from "../memory";
import { AIProvider } from "../ai/provider";
import { Logger } from "../logger/logger";
import { formatError } from "../utils";
import { ToolManager, ToolContext } from "../tools";
import { ConfigManager } from "../config";
import { ContextManager } from "./contextManager";

export class ConversationManager {
  private memoryManager: MemoryManager;
  private provider: AIProvider;
  private toolManager: ToolManager;
  private config: ConfigManager;
  private contextManager: ContextManager;

  constructor(
    memoryManager: MemoryManager,
    provider: AIProvider,
    toolManager: ToolManager,
    config: ConfigManager
  ) {
    this.memoryManager = memoryManager;
    this.provider = provider;
    this.toolManager = toolManager;
    this.config = config;
    this.contextManager = new ContextManager(memoryManager, config);
  }


  /**
   * Initializes the conversation session by loading/resuming the active conversation.
   */
  public async initialize(): Promise<void> {
    Logger.info("Initializing ConversationManager...");
    await this.memoryManager.initializeActiveConversation();
  }

  /**
   * Processes a user message: saves to memory, sends context history to the AI provider,
   * handles any tool execution requests from the provider recursively up to max turns,
   * saves response to memory, and returns the response.
   */
  public async processMessage(messageText: string): Promise<string> {
    Logger.debug(`ConversationManager processing message: ${messageText}`);

    // 1. Save user message to memory
    await this.memoryManager.saveMessage("user", messageText);

    let history = this.memoryManager.getHistory();
    const maxTurns = 5;
    let turns = 0;

    try {
      while (turns < maxTurns) {
        turns++;
        const toolsList = this.toolManager.getRegistry().listTools();

        // Optimize context history using the ContextManager
        const optimizedHistory = await this.contextManager.buildContext(history);

        // 2. Call the provider with optimized history context and tools list
        const response = await this.provider.chat(messageText, optimizedHistory, toolsList);

        if (response.toolCalls && response.toolCalls.length > 0) {
          // Save the assistant's response that requested tool calls
          await this.memoryManager.saveMessage("assistant", response.text || "", {
            toolCalls: response.toolCalls,
          });

          if (this.config.getSettings().debug) {
            Logger.debug(`[ConversationManager] Requested tools: ${response.toolCalls.map(tc => tc.name).join(", ")}`);
          }

          let executedCount = 0;
          let failedCount = 0;

          // 3. Execute the requested tools
          for (const toolCall of response.toolCalls) {
            const startToolTime = Date.now();
            Logger.info(`ConversationManager executing tool "${toolCall.name}" with args: ${JSON.stringify(toolCall.arguments)}`);

            const context: ToolContext = {
              memoryManager: this.memoryManager,
              history: this.memoryManager.getHistory(),
              settings: this.config.getSettings(),
              logger: Logger,
            };

            try {
              const result = await this.toolManager.execute(toolCall.name, toolCall.arguments, context);
              const toolDuration = Date.now() - startToolTime;
              executedCount++;

              if (this.config.getSettings().debug) {
                Logger.debug(`[ConversationManager] Executed tool "${toolCall.name}". Duration: ${toolDuration}ms. Success: ${result.success}`);
              }

              if (!result.success) {
                failedCount++;
                if (this.config.getSettings().debug) {
                  Logger.debug(`[ConversationManager] Tool "${toolCall.name}" failed: ${result.message || result.error?.message}`);
                }
              }

              // 4. Save tool response message to memory
              await this.memoryManager.saveMessage("tool", JSON.stringify(result), {
                toolName: toolCall.name,
              });
            } catch (err: any) {
              failedCount++;
              if (this.config.getSettings().debug) {
                Logger.debug(`[ConversationManager] Exception executing tool "${toolCall.name}": ${err.message}`);
              }
              // Save failed tool result to memory so the LLM knows it failed
              await this.memoryManager.saveMessage("tool", JSON.stringify({
                success: false,
                message: `Tool execution failed with error: ${err.message}`
              }), {
                toolName: toolCall.name,
              });
            }
          }

          if (this.config.getSettings().debug) {
            Logger.debug(`[ConversationManager] Tool Turn Execution Statistics: Executed: ${executedCount}, Failed: ${failedCount}`);
          }

          // Reload the updated history context for the next turn
          history = this.memoryManager.getHistory();
        } else {
          // LLM returned natural-language response, save and return
          const reply = response.text || "";
          await this.memoryManager.saveMessage("assistant", reply);
          return reply;
        }
      }

      const fallbackReply = "Tool execution limit reached. Please try again.";
      await this.memoryManager.saveMessage("assistant", fallbackReply);
      return fallbackReply;
    } catch (error: any) {
      Logger.error(`ConversationManager failed to process message with detailed error:\n${formatError(error)}`);
      throw error;
    }
  }


  /**
   * Retrieves the current conversation history.
   */
  public getHistory(): Message[] {
    return this.memoryManager.getHistory();
  }

  /**
   * Clears the current conversation history.
   */
  public async clearHistory(): Promise<void> {
    await this.memoryManager.clearHistory();
  }

  /**
   * Creates a new conversation thread.
   */
  public async startNewConversation(): Promise<void> {
    await this.memoryManager.createNewConversation();
  }
}
