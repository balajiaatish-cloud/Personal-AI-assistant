import { StorageEngine } from "../storage/storageEngine";
import { Conversation, createConversation } from "../models/conversation";
import { Message, createMessage, MessageRole } from "../models/message";
import { Logger } from "../../logger/logger";
import fs from "fs/promises";
import path from "path";

export interface GlobalMemory {
  facts: string[];
  userProfile: Record<string, any>;
  preferences: Record<string, any>;
}

export class MemoryManager {
  private storage: StorageEngine;
  private activeConversation: Conversation | null = null;
  private memoryFilePath: string;
  private globalMemory: GlobalMemory = { facts: [], userProfile: {}, preferences: {} };

  constructor(storage: StorageEngine, memoryDir: string = "./memory") {
    this.storage = storage;
    this.memoryFilePath = path.join(path.resolve(memoryDir), "memory.json");
  }

  /**
   * Initializes the active conversation.
   * Loads the last active conversation from storage, or creates a new one if none exists.
   */
  public async initializeActiveConversation(): Promise<Conversation> {
    try {
      // Pre-load global memory
      await this.loadGlobalMemory();

      // Cast the storage so we can check if it supports active conversation retrieval
      let lastActiveId: string | null = null;
      if ("getActiveConversationId" in this.storage) {
        lastActiveId = await (this.storage as any).getActiveConversationId();
      }

      if (lastActiveId) {
        const conversation = await this.storage.load(lastActiveId);
        if (conversation) {
          this.activeConversation = conversation;
          Logger.info(`Resumed active conversation: ${this.activeConversation.id}`);
          return this.activeConversation;
        }
      }

      // If no active conversation exists, create a new one
      return await this.createNewConversation();
    } catch (error: any) {
      Logger.error(`Error initializing active conversation: ${error.message}. Resetting to new conversation.`);
      return await this.createNewConversation();
    }
  }

  /**
   * Creates a new conversation, sets it as the active one, and persists this state.
   */
  public async createNewConversation(): Promise<Conversation> {
    const conversation = createConversation();
    this.activeConversation = conversation;
    
    await this.storage.save(conversation);
    if ("setActiveConversationId" in this.storage) {
      await (this.storage as any).setActiveConversationId(conversation.id);
    }
    
    Logger.info(`Created new active conversation: ${conversation.id}`);
    return conversation;
  }

  /**
   * Returns the currently active conversation.
   */
  public getActiveConversation(): Conversation | null {
    return this.activeConversation;
  }

  /**
   * Saves a message to the active conversation and persists it to storage.
   */
  public async saveMessage(role: MessageRole, content: string, metadata?: Record<string, any>): Promise<Message> {
    if (!this.activeConversation) {
      await this.initializeActiveConversation();
    }

    const message = createMessage(role, content, metadata);
    this.activeConversation!.messages.push(message);
    this.activeConversation!.updatedAt = new Date().toISOString();

    await this.storage.save(this.activeConversation!);
    return message;
  }

  /**
   * Returns the history of messages for the active conversation.
   */
  public getHistory(): Message[] {
    return this.activeConversation ? this.activeConversation.messages : [];
  }

  /**
   * Clears the message history of the active conversation and persists the empty list.
   */
  public async clearHistory(): Promise<void> {
    if (this.activeConversation) {
      this.activeConversation.messages = [];
      this.activeConversation.updatedAt = new Date().toISOString();
      await this.storage.save(this.activeConversation);
      Logger.info(`Cleared history for conversation: ${this.activeConversation.id}`);
    }
  }

  /**
   * Switches the active conversation to a specific conversation ID.
   */
  public async switchConversation(id: string): Promise<boolean> {
    const conv = await this.storage.load(id);
    if (conv) {
      this.activeConversation = conv;
      if ("setActiveConversationId" in this.storage) {
        await (this.storage as any).setActiveConversationId(id);
      }
      Logger.info(`Switched active conversation to: ${id}`);
      return true;
    }
    Logger.warn(`Failed to switch conversation: ID ${id} not found.`);
    return false;
  }

  // --- Global Memory File Management ---

  private async loadGlobalMemory(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.memoryFilePath), { recursive: true });
      try {
        const data = await fs.readFile(this.memoryFilePath, "utf-8");
        if (data.trim()) {
          this.globalMemory = JSON.parse(data);
          // Standardize fields to avoid undefined errors
          this.globalMemory.facts = this.globalMemory.facts || [];
          this.globalMemory.userProfile = this.globalMemory.userProfile || {};
          this.globalMemory.preferences = this.globalMemory.preferences || {};
          Logger.info(`Loaded global memory from: ${this.memoryFilePath}`);
          return;
        }
      } catch {
        // File does not exist yet, we will generate it on first save
      }
      await this.saveGlobalMemory();
    } catch (error: any) {
      Logger.error(`Failed to load global memory: ${error.message}`);
    }
  }

  private async saveGlobalMemory(): Promise<void> {
    const tempFile = `${this.memoryFilePath}.tmp`;
    try {
      const jsonString = JSON.stringify(this.globalMemory, null, 2);
      await fs.writeFile(tempFile, jsonString, "utf-8");
      await fs.rename(tempFile, this.memoryFilePath);
    } catch (error: any) {
      Logger.error(`Failed to save global memory: ${error.message}`);
      try {
        await fs.unlink(tempFile);
      } catch {}
    }
  }

  // --- Global Memory Accessors for Tools ---

  public async getFacts(): Promise<string[]> {
    return this.globalMemory.facts;
  }

  public async addFact(fact: string): Promise<void> {
    if (!this.globalMemory.facts.includes(fact)) {
      this.globalMemory.facts.push(fact);
      await this.saveGlobalMemory();
      Logger.info(`Saved new fact to global memory: "${fact}"`);
    }
  }

  public async getProfile(): Promise<Record<string, any>> {
    return this.globalMemory.userProfile;
  }

  public async setProfile(profile: Record<string, any>): Promise<void> {
    this.globalMemory.userProfile = {
      ...this.globalMemory.userProfile,
      ...profile,
    };
    await this.saveGlobalMemory();
    Logger.info(`Updated user profile in global memory.`);
  }

  public async getPreferences(): Promise<Record<string, any>> {
    return this.globalMemory.preferences;
  }

  public async setPreference(key: string, value: any): Promise<void> {
    this.globalMemory.preferences[key] = value;
    await this.saveGlobalMemory();
    Logger.info(`Set preference "${key}" in global memory.`);
  }
}
