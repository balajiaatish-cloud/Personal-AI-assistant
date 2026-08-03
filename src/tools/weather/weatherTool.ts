import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";
import { WeatherService, WeatherData } from "../../services/weatherService";

export interface WeatherInput {
  location: string;
}

export class WeatherTool implements Tool<WeatherInput, WeatherData> {
  public readonly name = "weather";
  public readonly description = "Retrieves the current weather conditions, temperature, humidity, wind speed, and basic forecast for the given city or location.";
  public readonly category = "weather";
  public readonly permissionLevel = "safe" as const;
  public readonly inputSchema = {
    type: "object",
    properties: {
      location: { type: "string", description: "The city and state/country (e.g. 'Paris', 'New York, NY')." }
    },
    required: ["location"]
  };

  public async execute(args: WeatherInput, context: ToolContext): Promise<ToolResult<WeatherData>> {
    if (!args || !args.location) {
      return {
        success: false,
        error: {
          code: "MissingParameters",
          message: "Missing required parameter: location"
        }
      };
    }

    try {
      const data = await WeatherService.getWeather(args.location, context.settings);
      return {
        success: true,
        data,
        message: `Successfully retrieved weather for "${data.location}"`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "WeatherError",
          message: `Weather lookup failed: ${err.message}`
        }
      };
    }
  }
}
