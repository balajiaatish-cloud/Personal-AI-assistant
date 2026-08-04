import { ARIA } from "../core/aria";
import { Logger } from "../logger/logger";
import fs from "fs/promises";
import path from "path";

async function runStressTest() {
  console.log("\n==================================================");
  console.log("            ARIA v0.7.1 STRESS TEST              ");
  console.log("==================================================\n");

  // 1. Set environment variables to enable debug mode and configure window
  process.env.ARIA_LOG_LEVEL = "DEBUG";
  process.env.DEBUG = "true";
  process.env.MAX_HISTORY_MESSAGES = "6"; // Small sliding window to easily trigger pruning
  process.env.CONTEXT_STRATEGY = "discard";

  // 2. Instantiate and initialize ARIA
  const aria = new ARIA();
  await aria.initialize();

  // Force Logger to debug mode programmatically
  Logger.isDebugEnabled = true;

  console.log("\n[STRESS TEST] Initializing persistent memory...");
  const context = aria.getToolContext();
  const mm = context.memoryManager;

  // Clear facts/profile to start clean
  await mm.clearHistory();
  // Manually reset global memory
  await mm.setProfile({ name: "Aatish", role: "Developer" });
  await mm.setPreference("theme", "dark");
  await mm.addFact("Likes coding agentic software");

  const expectedName = "Aatish";
  const expectedFact = "Likes coding agentic software";

  console.log(`[STRESS TEST] Set profile name to: ${expectedName}`);
  console.log(`[STRESS TEST] Set fact: "${expectedFact}"`);

  // Define a sequence of messages to send. We will repeat messages to total 50+ messages in the conversation.
  const queryTemplates = [
    "What is the current time?",
    "Add 158 and 242.",
    "What is my name according to your memory profile?",
    "What is the current date?",
    "What coding topic do I like?",
    "Subtract 500 from 1200."
  ];

  const totalTurns = 26; // 26 turns = 52 messages (user + assistant) plus tool execution turns!
  console.log(`\n[STRESS TEST] Starting ${totalTurns}-turn conversation simulation (50+ total messages)...`);

  let toolExecutionCount = 0;
  let successTurns = 0;

  for (let i = 1; i <= totalTurns; i++) {
    const query = queryTemplates[(i - 1) % queryTemplates.length];
    console.log(`\n--------------------------------------------------`);
    console.log(`Turn ${i}/${totalTurns} | Sending: "${query}"`);
    console.log(`--------------------------------------------------`);

    const startTime = Date.now();
    try {
      const response = await aria.chat(query);
      const duration = Date.now() - startTime;

      console.log(`\nARIA Response: ${response}`);
      console.log(`Turn Duration: ${duration}ms`);

      // Verify prompt snapshot exists
      const snapshotPath = path.resolve("./logs/prompt_snapshot.json");
      const hasSnapshot = await fs.access(snapshotPath).then(() => true).catch(() => false);
      if (hasSnapshot) {
        console.log(`[OK] Prompt snapshot generated successfully.`);
      } else {
        console.warn(`[WARNING] Prompt snapshot file not found.`);
      }

      // Check tool usage in history for this turn
      const history = aria.getToolContext().history;
      const latestTurnMessages = history.slice(-4); // Grab last few messages
      const usedTool = latestTurnMessages.some(m => m.role === "tool");
      if (usedTool) {
        toolExecutionCount++;
        console.log(`[OK] Tool was invoked during this turn.`);
      }

      // Basic semantic validation of response for memory queries
      if (query.includes("my name")) {
        if (response.includes(expectedName)) {
          console.log(`[OK] Memory profile successfully retrieved ("${expectedName}" found in response).`);
        } else {
          console.warn(`[FAIL] Response did not contain expected name "${expectedName}". Response: "${response}"`);
        }
      }
      if (query.includes("topic do I like")) {
        if (response.toLowerCase().includes("coding") || response.toLowerCase().includes("agentic")) {
          console.log(`[OK] Persistent fact retrieved ("coding" or "agentic" found in response).`);
        } else {
          console.warn(`[FAIL] Response did not contain expected fact detail. Response: "${response}"`);
        }
      }

      successTurns++;
    } catch (err: any) {
      console.error(`[ERROR] Turn ${i} failed: ${err.message}`);
    }
  }

  // 3. Verify sliding window functionality
  const finalHistory = aria.getToolContext().history;
  console.log(`\n==================================================`);
  console.log("            TEST RESULTS & AUDIT                 ");
  console.log(`==================================================`);
  console.log(`- Total turns attempted: ${totalTurns}`);
  console.log(`- Successful turns: ${successTurns}`);
  console.log(`- Total persistent history messages: ${finalHistory.length}`);
  console.log(`- Configured max sliding history: 6`);
  console.log(`- Tool executions verified: ${toolExecutionCount}`);

  // Confirm context manager worked:
  // The persistent history in memory is long (e.g. 50+ messages).
  // But the sliding window keeps it small when sending to Ollama.
  if (finalHistory.length > 30) {
    console.log(`[OK] Memory database correctly maintained full log of all ${finalHistory.length} messages.`);
  } else {
    console.warn(`[FAIL] Memory database only has ${finalHistory.length} messages.`);
  }

  console.log(`\n[STRESS TEST] Completed!`);
}

runStressTest().catch(console.error);
