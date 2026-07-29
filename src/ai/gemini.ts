import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { AIProvider } from "./provider";
import { Message } from "../memory";
import { formatError } from "../utils";
import { Logger } from "../logger/logger";

dotenv.config();

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async chat(prompt: string, history?: Message[]): Promise<string> {
    let contents: any = prompt;

    if (history && history.length > 0) {
      contents = history
        .filter(msg => msg.role === "user" || msg.role === "assistant")
        .map(msg => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        }));
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents,
      });

      return response.text ?? "";
    } catch (error: any) {
      Logger.error(`Gemini API call failed with detailed error:\n${formatError(error)}`);
      throw error;
    }
  }
}


