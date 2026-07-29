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

