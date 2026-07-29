export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatError(error: any): string {
  if (!error) return "Unknown error";
  
  let details = `Error Name: ${error.name || "Error"}\n`;
  details += `Error Message: ${error.message || String(error)}\n`;
  
  if (error.stack) {
    details += `Stack Trace:\n${error.stack}\n`;
  }
  if (error.status !== undefined) {
    details += `HTTP Status: ${error.status}\n`;
  }
  if (error.statusText) {
    details += `HTTP Status Text: ${error.statusText}\n`;
  }
  if (error.errorDetails) {
    details += `Error Details: ${JSON.stringify(error.errorDetails, null, 2)}\n`;
  }
  if (error.response) {
    details += `Response Body: ${JSON.stringify(error.response, null, 2)}\n`;
  }
  if (error.cause) {
    details += `Underlying Cause: ${error.cause.message || String(error.cause)}\n`;
    if (error.cause.stack) {
      details += `Cause Stack Trace:\n${error.cause.stack}\n`;
    }
  }
  return details;
}

