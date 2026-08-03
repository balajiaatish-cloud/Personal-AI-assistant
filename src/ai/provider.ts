import { Message } from "../memory";
import { Tool } from "../tools/base/tool";

export interface ToolCallRequest {
  name: string;
  arguments: any;
}

export interface ProviderResponse {
  text?: string;
  toolCalls?: ToolCallRequest[];
}

export interface AIProvider {
  chat(prompt: string, history?: Message[], tools?: Tool[]): Promise<ProviderResponse>;
}

