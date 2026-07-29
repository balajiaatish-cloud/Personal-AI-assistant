import crypto from "crypto";
import { Message } from "./message";

export interface Conversation {
  id: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  messages: Message[];
  
  // Future fields placeholders
  title?: string;
  summary?: string;
  tags?: string[];
  archived?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Creates a new empty Conversation object with a unique ID and current timestamp.
 */
export function createConversation(id?: string, metadata?: Record<string, any>): Conversation {
  const now = new Date().toISOString();
  return {
    id: id || crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    messages: [],
    metadata,
  };
}
