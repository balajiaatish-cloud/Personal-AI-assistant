import { MemoryManager, Message } from "../memory";
import { AIProvider } from "../ai/provider";
import { Logger } from "../logger/logger";
import { formatError } from "../utils";
import { ToolManager, ToolContext } from "../tools";
import { ConfigManager } from "../config";

export class ConversationManager {
  private memoryManager: MemoryManager;
  private provider: AIProvider;
  private toolManager: ToolManager;
  private config: ConfigManager;

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

        // 2. Call the provider with history context and tools list
        const response = await this.provider.chat(messageText, history, toolsList);

        if (response.toolCalls && response.toolCalls.length > 0) {
          // Save the assistant's response that requested tool calls
          await this.memoryManager.saveMessage("assistant", response.text || "", {
            toolCalls: response.toolCalls,
          });

          // 3. Execute the requested tools
          for (const toolCall of response.toolCalls) {
            Logger.info(`ConversationManager executing tool "${toolCall.name}" with args: ${JSON.stringify(toolCall.arguments)}`);

            const context: ToolContext = {
              memoryManager: this.memoryManager,
              history: this.memoryManager.getHistory(),
              settings: this.config.getSettings(),
              logger: Logger,
            };

            const result = await this.toolManager.execute(toolCall.name, toolCall.arguments, context);

            // 4. Save tool response message to memory
            await this.memoryManager.saveMessage("tool", JSON.stringify(result), {
              toolName: toolCall.name,
            });
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
