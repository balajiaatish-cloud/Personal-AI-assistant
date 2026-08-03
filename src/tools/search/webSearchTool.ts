import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";
import { SearchService, SearchResult } from "../../services/searchService";

export interface WebSearchInput {
  query: string;
}

export class WebSearchTool implements Tool<WebSearchInput, SearchResult[]> {
  public readonly name = "websearch";
  public readonly description = "Searches the web for the given query and returns URLs, titles, and concise snippets of the top search results. Use this tool whenever the user asks about real-time events, current data, or information outside your local knowledge base.";
  public readonly category = "search";
  public readonly permissionLevel = "safe" as const;
  public readonly inputSchema = {
    type: "object",
    properties: {
      query: { type: "string", description: "The search query to run on the web." }
    },
    required: ["query"]
  };

  public async execute(args: WebSearchInput, context: ToolContext): Promise<ToolResult<SearchResult[]>> {
    if (!args || !args.query) {
      return {
        success: false,
        error: {
          code: "MissingParameters",
          message: "Missing required parameter: query"
        }
      };
    }

    try {
      const results = await SearchService.search(args.query, context.settings);
      return {
        success: true,
        data: results,
        message: `Found ${results.length} search results for "${args.query}"`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "SearchError",
          message: `Search operation failed: ${err.message}`
        }
      };
    }
  }
}
