import { Message } from "../memory";

export interface AIProvider {
  chat(prompt: string, history?: Message[]): Promise<string>;
}

