import { Logger } from "../logger/logger";

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  body?: any;
}

export class HttpService {
  private static defaultTimeout = 10000; // 10 seconds
  private static defaultHeaders = {
    "User-Agent": "ARIA-Assistant/0.7.0",
    "Content-Type": "application/json",
  };

  /**
   * Performs a GET request with timeout and retries.
   */
  public static async get<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>(url, "GET", options);
  }

  /**
   * Performs a POST request with timeout and retries.
   */
  public static async post<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>(url, "POST", options);
  }

  private static async request<T>(
    url: string,
    method: "GET" | "POST",
    options: HttpRequestOptions
  ): Promise<T> {
    const timeout = options.timeoutMs ?? this.defaultTimeout;
    const maxRetries = options.retries ?? 3;
    const headers = { ...this.defaultHeaders, ...options.headers };

    let attempt = 0;
    while (attempt < maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        Logger.debug(`HttpService [${method}] sending attempt ${attempt}/${maxRetries} to: ${url}`);
        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (method === "POST" && options.body) {
          fetchOptions.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error Status ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return (await response.json()) as T;
        } else {
          return (await response.text()) as unknown as T;
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        Logger.warn(`HttpService attempt ${attempt} failed: ${error.message}`);
        
        if (attempt >= maxRetries) {
          Logger.error(`HttpService: All ${maxRetries} attempts failed for: ${url}`);
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("HttpService request failed after max retries");
  }
}
