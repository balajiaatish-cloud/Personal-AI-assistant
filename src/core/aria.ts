import { AIProvider } from "../ai/provider";
import { AIProviderFactory } from "../ai/factory";
import { ConfigManager } from "../config";
import { Logger } from "../logger/logger";
import { JSONStorage, MemoryManager } from "../memory";
import { ConversationManager } from "../chat/conversationManager";
import {
  ToolRegistry,
  ToolExecutor,
  ToolManager,
  ToolContext,
  CalculatorTool,
  DateTimeTool,
  TimeTool,
  DateTool,
  MemoryTool,
  SystemTool,
  FileSystemTool
} from "../tools";

export class ARIA {
  private provider: AIProvider;
  private config: ConfigManager;
  private storage: JSONStorage;
  private memoryManager: MemoryManager;
  private conversationManager: ConversationManager;
  private initialized: boolean = false;
  
  // Public properties for CLI command executor access
  public readonly toolRegistry: ToolRegistry;
  public readonly toolExecutor: ToolExecutor;
  public readonly toolManager: ToolManager;

  constructor() {
    this.config = new ConfigManager();
    const settings = this.config.getSettings();

    this.provider = AIProviderFactory.createProvider();

    // 1. Tool Framework Initialization
    this.toolRegistry = new ToolRegistry();
    this.toolExecutor = new ToolExecutor(this.toolRegistry);
    this.toolManager = new ToolManager(this.toolRegistry, this.toolExecutor);

    // 2. Register Built-in Tools
    this.toolRegistry.register(new CalculatorTool());
    this.toolRegistry.register(new DateTimeTool());
    this.toolRegistry.register(new TimeTool());
    this.toolRegistry.register(new DateTool());
    this.toolRegistry.register(new MemoryTool());
    this.toolRegistry.register(new SystemTool());
    this.toolRegistry.register(new FileSystemTool());
    
    // 3. Instantiate storage and memory layers
    this.storage = new JSONStorage(
      settings.memory.directory,
      settings.memory.filename
    );
    this.memoryManager = new MemoryManager(this.storage, settings.memory.directory);
    
    // 4. Inject dependencies into core conversation flow coordinator
    this.conversationManager = new ConversationManager(
      this.memoryManager,
      this.provider,
      this.toolManager,
      this.config
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

  /**
   * Generates a fresh ToolContext for tool executions outside ConversationManager (e.g. manual CLI invocation).
   */
  public getToolContext(): ToolContext {
    return {
      memoryManager: this.memoryManager,
      history: this.memoryManager.getHistory(),
      settings: this.config.getSettings(),
      logger: Logger,
    };
  }
}


