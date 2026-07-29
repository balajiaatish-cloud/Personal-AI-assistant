import { StorageEngine } from "../storage/storageEngine";
import { Conversation, createConversation } from "../models/conversation";
import { Message, createMessage, MessageRole } from "../models/message";
import { Logger } from "../../logger/logger";

export class MemoryManager {
  private storage: StorageEngine;
  private activeConversation: Conversation | null = null;

  constructor(storage: StorageEngine) {
    this.storage = storage;
  }

  /**
   * Initializes the active conversation.
   * Loads the last active conversation from storage, or creates a new one if none exists.
   */
  public async initializeActiveConversation(): Promise<Conversation> {
    try {
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
  public async saveMessage(role: MessageRole, content: string): Promise<Message> {
    if (!this.activeConversation) {
      await this.initializeActiveConversation();
    }

    const message = createMessage(role, content);
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
}
