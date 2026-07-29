import { Conversation } from "../models/conversation";

export interface StorageEngine {
  /**
   * Loads a conversation by its ID. Returns null if not found.
   */
  load(id: string): Promise<Conversation | null>;

  /**
   * Saves a new conversation.
   */
  save(conversation: Conversation): Promise<void>;

  /**
   * Updates an existing conversation.
   */
  update(conversation: Conversation): Promise<void>;

  /**
   * Deletes a conversation by its ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Clears all stored conversations.
   */
  clear(): Promise<void>;

  /**
   * Lists all stored conversations.
   */
  list(): Promise<Conversation[]>;
}
