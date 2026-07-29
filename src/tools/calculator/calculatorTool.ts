import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";

export interface CalculatorInput {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}

export class CalculatorTool implements Tool<CalculatorInput, number> {
  public readonly name = "calculator";
  public readonly description = "Performs basic mathematical operations (add, subtract, multiply, divide).";
  public readonly category = "mathematics";
  public readonly inputSchema = {
    type: "object",
    properties: {
      operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
      a: { type: "number" },
      b: { type: "number" }
    },
    required: ["operation", "a", "b"]
  };

  public async execute(args: CalculatorInput): Promise<ToolResult<number>> {
    // Basic structural validation
    if (!args || typeof args !== "object") {
      return {
        success: false,
        message: "Invalid input arguments. Expected an object with operation, a, and b.",
        error: "InvalidParameters",
      };
    }

    const { operation, a, b } = args;

    if (operation === undefined || a === undefined || b === undefined) {
      return {
        success: false,
        message: "Missing required parameters: operation, a, b",
        error: "MissingParameters",
      };
    }

    const numA = Number(a);
    const numB = Number(b);

    if (isNaN(numA) || isNaN(numB)) {
      return {
        success: false,
        message: "Parameters a and b must be valid numbers.",
        error: "InvalidParameters",
      };
    }

    switch (operation) {
      case "add":
        return {
          success: true,
          data: numA + numB,
          message: `Successfully added ${numA} and ${numB}`,
        };
      case "subtract":
        return {
          success: true,
          data: numA - numB,
          message: `Successfully subtracted ${numB} from ${numA}`,
        };
      case "multiply":
        return {
          success: true,
          data: numA * numB,
          message: `Successfully multiplied ${numA} by ${numB}`,
        };
      case "divide":
        if (numB === 0) {
          return {
            success: false,
            message: "Division by zero is not allowed.",
            error: "DivideByZero",
          };
        }
        return {
          success: true,
          data: numA / numB,
          message: `Successfully divided ${numA} by ${numB}`,
        };
      default:
        return {
          success: false,
          message: `Unknown operation "${operation}". Supported: add, subtract, multiply, divide.`,
          error: "InvalidOperation",
        };
    }
  }
}
