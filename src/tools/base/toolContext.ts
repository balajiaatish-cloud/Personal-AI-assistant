import { MemoryManager } from "../../memory/services/memoryManager";
import { Message } from "../../memory/models/message";
import { Settings } from "../../config";
import { Logger } from "../../logger/logger";

export interface ToolContext {
  memoryManager: MemoryManager;
  history: Message[];
  settings: Settings;
  logger: typeof Logger;
}
