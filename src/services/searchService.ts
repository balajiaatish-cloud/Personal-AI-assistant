import { HttpService } from "./httpService";
import { Settings } from "../config";
import { Logger } from "../logger/logger";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

export class MockSearchProvider implements SearchProvider {
  public async search(query: string): Promise<SearchResult[]> {
    Logger.info(`MockSearchProvider executing search for query: "${query}"`);
    return [
      {
        title: `Mock result for: ${query}`,
        url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `This is a simulated search result for your query "${query}". It provides a fallback when no real APIs are configured or network connectivity is unavailable.`
      },
      {
        title: "Advanced Reasoning & Intelligence Assistant (ARIA)",
        url: "https://github.com/aria-ai/assistant",
        snippet: "ARIA is a modular, desktop AI assistant designed to demonstrate agentic capabilities such as multi-turn tool calling and persistent memory."
      },
      {
        title: "Vite.js - Next Generation Frontend Tooling",
        url: "https://vite.dev",
        snippet: "Vite is a modern frontend build tool that is extremely fast. It features a dev server with Hot Module Replacement and builds optimized bundles."
      }
    ];
  }
}

export class DuckDuckGoApiSearchProvider implements SearchProvider {
  public async search(query: string): Promise<SearchResult[]> {
    Logger.info(`DuckDuckGoApiSearchProvider searching: "${query}"`);
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    
    const data = await HttpService.get<any>(url);
    const results: SearchResult[] = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || "Abstract Summary",
        url: data.AbstractURL || "https://duckduckgo.com",
        snippet: data.AbstractText,
      });
    }

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || "Related Search Result",
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    // Default fallback if no structured abstract or related topic returns
    if (results.length === 0) {
      results.push({
        title: `${query} on DuckDuckGo`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `No instant answer summary was found for "${query}". Visit DuckDuckGo directly for full results.`,
      });
    }

    return results;
  }
}

export class GoogleSearchProvider implements SearchProvider {
  private apiKey: string;
  private cx: string;

  constructor(apiKey: string, cx: string) {
    this.apiKey = apiKey;
    this.cx = cx;
  }

  public async search(query: string): Promise<SearchResult[]> {
    Logger.info(`GoogleSearchProvider searching: "${query}"`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.cx}&q=${encodeURIComponent(query)}`;
    
    const data = await HttpService.get<any>(url);
    const results: SearchResult[] = [];

    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items.slice(0, 5)) {
        results.push({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
        });
      }
    }

    return results;
  }
}

export class SearchService {
  public static async search(query: string, settings: Settings): Promise<SearchResult[]> {
    const providerType = settings.search.provider;
    let provider: SearchProvider;

    switch (providerType) {
      case "duckduckgo":
        provider = new DuckDuckGoApiSearchProvider();
        break;
      case "google":
        if (settings.search.apiKey && settings.search.cx) {
          provider = new GoogleSearchProvider(settings.search.apiKey, settings.search.cx);
        } else {
          Logger.warn("Google Search settings missing apiKey or cx. Falling back to DuckDuckGo API Search.");
          provider = new DuckDuckGoApiSearchProvider();
        }
        break;
      case "mock":
      default:
        provider = new MockSearchProvider();
        break;
    }

    try {
      return await provider.search(query);
    } catch (err: any) {
      Logger.error(`Search failed using provider "${providerType}": ${err.message}. Cascading to MockSearchProvider.`);
      return await new MockSearchProvider().search(query);
    }
  }
}
