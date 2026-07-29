import { AIProvider } from "../ai/provider";
import { AIProviderFactory } from "../ai/factory";
import { ConfigManager } from "../config";
import { Logger } from "../logger/logger";
import { JSONStorage, MemoryManager } from "../memory";
import { ConversationManager } from "../chat/conversationManager";

export class ARIA {
  private provider: AIProvider;
  private config: ConfigManager;
  private storage: JSONStorage;
  private memoryManager: MemoryManager;
  private conversationManager: ConversationManager;
  private initialized: boolean = false;

  constructor() {
    this.config = new ConfigManager();
    const settings = this.config.getSettings();

    this.provider = AIProviderFactory.createProvider();
    
    // Instantiate storage and memory layers with configuration
    this.storage = new JSONStorage(
      settings.memory.directory,
      settings.memory.filename
    );
    this.memoryManager = new MemoryManager(this.storage);
    
    // Core conversation flow coordinator
    this.conversationManager = new ConversationManager(
      this.memoryManager,
      this.provider
    );
  }

  /**
   * Initializes the persistent memory and loads previous conversation context.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.conversationManager.initialize();
    this.initialized = true;
  }

  async chat(message: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    Logger.debug(`ARIA received message: ${message}`);
    const response = await this.conversationManager.processMessage(message);
    return response;
  }
}

