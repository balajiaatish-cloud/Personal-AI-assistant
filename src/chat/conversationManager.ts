import { MemoryManager, Message } from "../memory";
import { AIProvider } from "../ai/provider";
import { Logger } from "../logger/logger";
import { formatError } from "../utils";
import { ToolRegistry } from "../tools";

export class ConversationManager {
  private memoryManager: MemoryManager;
  private provider: AIProvider;
  private toolRegistry: ToolRegistry;

  constructor(memoryManager: MemoryManager, provider: AIProvider, toolRegistry: ToolRegistry) {
    this.memoryManager = memoryManager;
    this.provider = provider;
    this.toolRegistry = toolRegistry;
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
   * saves response to memory, and returns the response.
   */
  public async processMessage(messageText: string): Promise<string> {
    Logger.debug(`ConversationManager processing message: ${messageText}`);

    // 1. Save user message to memory
    await this.memoryManager.saveMessage("user", messageText);

    // 2. Load the full message history to pass as context
    const history = this.memoryManager.getHistory();

    try {
      // 3. Call the provider with history context
      const reply = await this.provider.chat(messageText, history);

      // 4. Save the assistant's response to memory
      await this.memoryManager.saveMessage("assistant", reply);

      return reply;
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
