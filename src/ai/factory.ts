import { AIProvider } from "./provider";
import { GeminiProvider } from "./gemini";
import { ModelProviderType } from "./models";

export class AIProviderFactory {
  static createProvider(type: ModelProviderType = ModelProviderType.GEMINI): AIProvider {
    switch (type) {
      case ModelProviderType.GEMINI:
        return new GeminiProvider();
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }
}
