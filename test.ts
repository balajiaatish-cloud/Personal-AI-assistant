import { ai } from "./lib/gemini";

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Hello! Introduce yourself as ARIA, Aatish's personal AI assistant.",
  });

  console.log(response.text);
}

main().catch(console.error);
