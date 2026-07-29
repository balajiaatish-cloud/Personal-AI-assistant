import crypto from "crypto";

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO String
  metadata?: Record<string, any>;
  
  // Future fields placeholder
  tokenCount?: number;
  embeddings?: number[];
  importanceScore?: number;
}

/**
 * Creates a new Message object with a unique ID and current timestamp.
 */
export function createMessage(
  role: MessageRole,
  content: string,
  metadata?: Record<string, any>
): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
