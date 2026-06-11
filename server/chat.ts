import { GoogleGenAI } from "@google/genai";
import { tools, getSystemPrompt } from "./tools.js";
import * as db from "./db.js";

let genaiInstance: any = null;

function getGenAI() {
  if (!genaiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }
    genaiInstance = new GoogleGenAI({ apiKey });
  }
  return genaiInstance;
}

/**
 * The function dispatch map — maps Gemini function call names
 * to actual database operations.
 */
async function executeFunctionCall(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<any> {
  switch (name) {
    case "createGoal":
      return db.createGoal(userId, args);
    case "createTask":
      return db.createTask(userId, args);
    case "createPlan":
      return db.createPlan(userId, args);
    case "listGoals":
      return db.listGoals(userId, args.status || "active");
    case "controlTimer":
      return args; // Direct pass-through client-side action
    default:
      return { error: `Unknown function: ${name}` };
  }
}

/**
 * Main chat handler.
 * Runs the complete Gemini function calling loop:
 *   1. Send user message + tools to Gemini
 *   2. If Gemini returns function calls, execute them against the DB
 *   3. Feed the results back to Gemini for a final conversational response
 *   4. Return the response + list of actions taken (for frontend UI sync)
 */
export async function handleChat(
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }>
) {
  const currentDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format

  // Build conversation history for Gemini
  const contents = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  // Add the new user message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  // Step 1: Send to Gemini with tools
  const response = await getGenAI().models.generateContent({
    model: "gemini-2.5-pro",
    contents,
    config: {
      tools,
      systemInstruction: getSystemPrompt(currentDate),
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate) {
    return { reply: "I'm sorry, I couldn't process that. Please try again.", actions: [] };
  }

  // Check if Gemini wants to call functions
  const functionCalls = candidate.content?.parts?.filter(
    (p: any) => p.functionCall
  );

  // If no function calls, return the text response directly
  if (!functionCalls || functionCalls.length === 0) {
    const textParts = candidate.content?.parts?.filter((p: any) => p.text);
    const reply = textParts?.map((p: any) => p.text).join("") || "I'm here to help! What would you like to do?";
    return { reply, actions: [] };
  }

  // Step 2: Execute all function calls
  const actions: Array<{ type: string; data: any }> = [];
  const functionResponses: any[] = [];

  for (const part of functionCalls) {
    const fc = (part as any).functionCall;
    console.log(`[AI] Executing tool: ${fc.name}`, JSON.stringify(fc.args));

    try {
      const result = await executeFunctionCall(fc.name, fc.args, userId);

      actions.push({
        type: fc.name,
        data: result,
      });

      functionResponses.push({
        functionResponse: {
          name: fc.name,
          response: { result: JSON.stringify(result) },
        },
      });
    } catch (error: any) {
      console.error(`[AI] Tool execution failed: ${fc.name}`, error.message);

      functionResponses.push({
        functionResponse: {
          name: fc.name,
          response: { error: error.message },
        },
      });
    }
  }

  // Step 3: Feed function results back to Gemini for a final conversational message
  const followUp = [
    ...contents,
    { role: "model", parts: functionCalls },
    { role: "user", parts: functionResponses },
  ];

  const finalResponse = await getGenAI().models.generateContent({
    model: "gemini-2.5-pro",
    contents: followUp,
    config: {
      systemInstruction: getSystemPrompt(currentDate),
    },
  });

  const finalText =
    finalResponse.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join("") || "Done! I've updated your dashboard.";

  return { reply: finalText, actions };
}
