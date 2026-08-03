import { HttpService } from "./httpService";
import { Settings } from "../config";
import { Logger } from "../logger/logger";

export interface WeatherForecast {
  day: string;
  tempMax: number;
  tempMin: number;
  condition: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  forecast: WeatherForecast[];
}

export interface WeatherProvider {
  getWeather(location: string): Promise<WeatherData>;
}

export class MockWeatherProvider implements WeatherProvider {
  public async getWeather(location: string): Promise<WeatherData> {
    Logger.info(`MockWeatherProvider executing weather check for location: "${location}"`);
    return {
      location: `${location} (Mock City)`,
      temperature: 22,
      humidity: 60,
      windSpeed: 12,
      condition: "Partly Cloudy",
      forecast: [
        { day: "Today", tempMax: 24, tempMin: 18, condition: "Partly Cloudy" },
        { day: "Tomorrow", tempMax: 26, tempMin: 19, condition: "Sunny" },
        { day: "Day after", tempMax: 21, tempMin: 15, condition: "Light Rain" }
      ]
    };
  }
}

export class OpenMeteoWeatherProvider implements WeatherProvider {
  public async getWeather(location: string): Promise<WeatherData> {
    Logger.info(`OpenMeteoWeatherProvider geocoding: "${location}"`);
    
    // 1. Geocode location to get coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geoData = await HttpService.get<any>(geoUrl);

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Location not found: "${location}"`);
    }

    const firstResult = geoData.results[0];
    const { latitude, longitude, name, country } = firstResult;
    const resolvedName = country ? `${name}, ${country}` : name;
    
    Logger.info(`OpenMeteoWeatherProvider found coordinates: lat=${latitude}, lon=${longitude} for "${resolvedName}"`);

    // 2. Query forecast API
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
    const data = await HttpService.get<any>(forecastUrl);

    if (!data.current) {
      throw new Error(`Failed to fetch current weather details for lat=${latitude}, lon=${longitude}`);
    }

    const current = data.current;
    const daily = data.daily || {};

    const forecast: WeatherForecast[] = [];
    if (daily.time && Array.isArray(daily.time)) {
      for (let i = 0; i < Math.min(daily.time.length, 3); i++) {
        forecast.push({
          day: daily.time[i],
          tempMax: daily.temperature_2m_max?.[i] ?? 0,
          tempMin: daily.temperature_2m_min?.[i] ?? 0,
          condition: this.mapWmoCode(daily.weather_code?.[i] ?? 0),
        });
      }
    }

    return {
      location: resolvedName,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      condition: this.mapWmoCode(current.weather_code),
      forecast,
    };
  }

  private mapWmoCode(code: number): string {
    if (code === 0) return "Clear sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code === 45 || code === 48) return "Foggy";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 61 && code <= 65) return "Rainy";
    if (code >= 71 && code <= 75) return "Snowy";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 95 && code <= 99) return "Thunderstorm";
    return "Overcast";
  }
}

export class WeatherService {
  public static async getWeather(location: string, settings: Settings): Promise<WeatherData> {
    const providerType = settings.weather.provider;
    let provider: WeatherProvider;

    switch (providerType) {
      case "openmeteo":
        provider = new OpenMeteoWeatherProvider();
        break;
      case "mock":
      default:
        provider = new MockWeatherProvider();
        break;
    }

    try {
      return await provider.getWeather(location);
    } catch (err: any) {
      Logger.error(`Weather lookup failed using provider "${providerType}": ${err.message}. Cascading to MockWeatherProvider.`);
      return await new MockWeatherProvider().getWeather(location);
    }
  }
}
