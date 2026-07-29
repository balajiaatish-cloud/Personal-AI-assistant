import { aria } from "./index";
import readline from "readline";

async function main() {
  // Pre-initialize ARIA to load memory and display startup logs before prompt
  await aria.initialize();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n==================================================");
  console.log("      ARIA Interactive CLI (Type 'exit' to quit) ");
  console.log("==================================================\n");

  const promptUser = () => {
    rl.question("\nYou: ", async (input) => {
      const trimmedInput = input.trim();
      const lowerInput = trimmedInput.toLowerCase();

      if (
        lowerInput === "exit" ||
        lowerInput === "quit" ||
        lowerInput === "/exit" ||
        lowerInput === "/quit"
      ) {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      if (!trimmedInput) {
        promptUser();
        return;
      }

      // 1. Intercept manual tool registration listing command
      if (lowerInput === "/tools") {
        const tools = aria.toolRegistry.listTools();
        console.log("\nAvailable Registered Tools:");
        tools.forEach((t) => {
          console.log(`- ${t.name}: ${t.description} (Category: ${t.category || "None"})`);
        });
        promptUser();
        return;
      }

      // 2. Intercept manual tool execution command
      if (lowerInput.startsWith("/tool ")) {
        const match = trimmedInput.match(/^\/tool\s+(\S+)(?:\s+(.+))?$/);
        if (!match) {
          console.log("\nUsage: /tool <toolName> <optional JSON arguments>");
          promptUser();
          return;
        }

        const toolName = match[1];
        const jsonArgsStr = match[2]?.trim() || "{}";

        let args: unknown = {};
        try {
          args = JSON.parse(jsonArgsStr);
        } catch (err: any) {
          console.log(`\n[ERROR] Failed to parse arguments as JSON: ${err.message}`);
          console.log(`Example: /tool calculator {"operation":"add","a":2,"b":3}`);
          promptUser();
          return;
        }

        try {
          console.log(`\nARIA: Executing tool "${toolName}"...`);
          const result = await aria.toolExecutor.execute(toolName, args);
          console.log(`\nTool Result:\n${JSON.stringify(result, null, 2)}`);
        } catch (err: any) {
          console.log(`\n[ERROR] Tool execution exception: ${err.message}`);
        }

        promptUser();
        return;
      }

      try {
        process.stdout.write("ARIA: Thinking...\r");
        const response = await aria.chat(trimmedInput);
        
        // Clear the "ARIA: Thinking..." text and print response
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.log(`ARIA: ${response}`);
      } catch (error: any) {
        console.log(`\n[ERROR] Failed to get response: ${error.message}`);
      }

      promptUser();
    });
  };


  promptUser();

  rl.on("SIGINT", () => {
    console.log("\nGoodbye!");
    rl.close();
    process.exit(0);
  });
}

main().catch(console.error);

