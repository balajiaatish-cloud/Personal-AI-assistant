import fs from "fs/promises";
import path from "path";
import { StorageEngine } from "./storageEngine";
import { Conversation } from "../models/conversation";
import { Logger } from "../../logger/logger";

interface StorageSchema {
  version: string;
  activeConversation: string | null;
  conversations: Conversation[];
}

export class JSONStorage implements StorageEngine {
  private readonly filepath: string;
  private readonly dirpath: string;

  constructor(directory: string = "./memory", filename: string = "conversations.json") {
    this.dirpath = path.resolve(directory);
    this.filepath = path.join(this.dirpath, filename);
  }

  /**
   * Initializes the storage directory and file if they do not exist.
   */
  private async ensureInitialized(): Promise<void> {
    try {
      await fs.mkdir(this.dirpath, { recursive: true });
      try {
        await fs.access(this.filepath);
      } catch {
        // File does not exist, initialize with default empty schema
        await this.writeRaw({
          version: "1.0",
          activeConversation: null,
          conversations: [],
        });
        Logger.info(`Initialized empty memory storage at: ${this.filepath}`);
      }
    } catch (error: any) {
      Logger.error(`Failed to initialize JSON storage: ${error.message}`);
    }
  }

  /**
   * Read raw schema from storage. Gracefully handles corrupted JSON.
   */
  private async readRaw(): Promise<StorageSchema> {
    await this.ensureInitialized();
    try {
      const data = await fs.readFile(this.filepath, "utf-8");
      if (!data.trim()) {
        Logger.warn("Memory storage file is empty. Resetting to default schema.");
        return this.resetStorage();
      }
      const parsed = JSON.parse(data) as StorageSchema;
      
      // Ensure the structure matches schema basics
      if (!parsed.version || !Array.isArray(parsed.conversations)) {
        throw new Error("Invalid schema structure");
      }
      return parsed;
    } catch (error: any) {
      Logger.warn(`Memory storage file is corrupted or unreadable (${error.message}). Attempting recovery.`);
      return this.recoverCorruptedStorage();
    }
  }

  /**
   * Safe write method that writes to a temporary file first, then renames.
   */
  private async writeRaw(data: StorageSchema): Promise<void> {
    const tempFile = `${this.filepath}.tmp`;
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(tempFile, jsonString, "utf-8");
      await fs.rename(tempFile, this.filepath);
    } catch (error: any) {
      Logger.error(`Error during safe write to memory storage: ${error.message}`);
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFile);
      } catch {}
      throw error;
    }
  }

  /**
   * Recovers corrupted storage by backing it up and resetting it.
   */
  private async recoverCorruptedStorage(): Promise<StorageSchema> {
    const backupPath = `${this.filepath}.corrupt.${Date.now()}.bak`;
    try {
      await fs.copyFile(this.filepath, backupPath);
      Logger.warn(`Corrupted memory file backed up to: ${backupPath}`);
    } catch (error: any) {
      Logger.error(`Could not create backup of corrupted file: ${error.message}`);
    }
    return this.resetStorage();
  }

  /**
   * Resets storage to default state.
   */
  private async resetStorage(): Promise<StorageSchema> {
    const defaultSchema: StorageSchema = {
      version: "1.0",
      activeConversation: null,
      conversations: [],
    };
    try {
      await this.writeRaw(defaultSchema);
    } catch (error: any) {
      Logger.error(`Failed to reset storage file: ${error.message}`);
    }
    return defaultSchema;
  }

  // --- StorageEngine Interface Implementation ---

  public async load(id: string): Promise<Conversation | null> {
    const schema = await this.readRaw();
    const conv = schema.conversations.find((c) => c.id === id);
    return conv || null;
  }

  public async save(conversation: Conversation): Promise<void> {
    const schema = await this.readRaw();
    // Check if it already exists to avoid duplicate saves
    const index = schema.conversations.findIndex((c) => c.id === conversation.id);
    if (index !== -1) {
      schema.conversations[index] = conversation;
    } else {
      schema.conversations.push(conversation);
    }
    await this.writeRaw(schema);
  }

  public async update(conversation: Conversation): Promise<void> {
    const schema = await this.readRaw();
    const index = schema.conversations.findIndex((c) => c.id === conversation.id);
    if (index === -1) {
      throw new Error(`Conversation with ID ${conversation.id} not found in storage.`);
    }
    schema.conversations[index] = conversation;
    await this.writeRaw(schema);
  }

  public async delete(id: string): Promise<void> {
    const schema = await this.readRaw();
    schema.conversations = schema.conversations.filter((c) => c.id !== id);
    if (schema.activeConversation === id) {
      schema.activeConversation = null;
    }
    await this.writeRaw(schema);
  }

  public async clear(): Promise<void> {
    const schema = await this.readRaw();
    schema.conversations = [];
    schema.activeConversation = null;
    await this.writeRaw(schema);
  }

  public async list(): Promise<Conversation[]> {
    const schema = await this.readRaw();
    return schema.conversations;
  }

  // --- Active Conversation Persistence ---

  public async getActiveConversationId(): Promise<string | null> {
    const schema = await this.readRaw();
    return schema.activeConversation;
  }

  public async setActiveConversationId(id: string | null): Promise<void> {
    const schema = await this.readRaw();
    schema.activeConversation = id;
    await this.writeRaw(schema);
  }
}
