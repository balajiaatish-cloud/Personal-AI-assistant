import { AIProvider } from "./provider";
import { OllamaProvider } from "./ollama";
import { ModelProviderType } from "./models";

export class AIProviderFactory {
  static createProvider(type: ModelProviderType = ModelProviderType.OLLAMA): AIProvider {
    switch (type) {
      case ModelProviderType.OLLAMA:
        return new OllamaProvider();
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }
}
