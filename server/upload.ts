import fs from "fs";
import path from "path";
import multer from "multer";
import os from "os";
import { GoogleGenAI } from "@google/genai";
import { tools, getSystemPrompt, getFileAnalysisPrompt } from "./tools.js";
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

// ─── Multer Configuration ───
// Store uploaded files in a temp directory inside the project (use os.tmpdir for Vercel)
const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "trackergoal-uploads")
  : path.resolve("server/.uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, WebP.`));
    }
  },
});

// ─── Function dispatch (shared with chat.ts — could be DRY'd later) ───
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
      return args;
    default:
      return { error: `Unknown function: ${name}` };
  }
}

/**
 * Handles file upload + multimodal inference.
 *
 * Flow:
 *   1. Accept the uploaded file via multer
 *   2. Upload to Google File API using ai.files.upload()
 *   3. Send a multimodal request to Gemini with the file ref + analysis prompt + tools
 *   4. Execute any function calls (createGoal, createPlan, etc.)
 *   5. Feed results back to Gemini for a final conversational summary
 *   6. Clean up: delete local temp file AND remote Google file
 */
export async function handleFileUpload(
  userId: string,
  message: string,
  filePath: string,
  originalName: string,
  mimeType: string,
) {
  let googleFileName: string | null = null;

  try {
    const currentDate = new Date().toLocaleDateString("en-CA");

    // ── Step 1: Upload the file to Google File API ──
    console.log(`[Upload] Uploading ${originalName} (${mimeType}) to Google...`);

    const uploadResult = await getGenAI().files.upload({
      file: filePath,
      config: {
        mimeType: mimeType,
        displayName: originalName,
      },
    });

    googleFileName = uploadResult.name!;
    const googleFileUri = uploadResult.uri!;

    console.log(`[Upload] Google file ready: ${googleFileName}`);

    // ── Step 2: Build the multimodal content parts ──
    const userPrompt = message || `Analyze this file "${originalName}" and create a 10-day study roadmap from it.`;

    const contentParts: any[] = [
      {
        fileData: {
          fileUri: googleFileUri,
          mimeType: mimeType,
        },
      },
      {
        text: userPrompt,
      },
    ];

    // ── Step 3: Send to Gemini with file analysis system prompt + tools ──
    const response = await getGenAI().models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: contentParts }],
      config: {
        tools,
        systemInstruction: getSystemPrompt(currentDate) + "\n\n" + getFileAnalysisPrompt(currentDate),
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      return { reply: "I couldn't analyze that file. Please try again.", actions: [] };
    }

    // ── Step 4: Separate text parts and function calls ──
    const allParts = candidate.content?.parts || [];
    const textParts = allParts.filter((p: any) => p.text);
    const functionCalls = allParts.filter((p: any) => p.functionCall);

    let summary = textParts.map((p: any) => p.text).join("") || "";

    // If no function calls, return just the summary
    if (functionCalls.length === 0) {
      return {
        reply: summary || "I've read through the file. What would you like me to do with it?",
        actions: [],
      };
    }

    // ── Step 5: Execute all function calls against the DB ──
    const actions: Array<{ type: string; data: any }> = [];
    const functionResponses: any[] = [];

    for (const part of functionCalls) {
      const fc = (part as any).functionCall;
      console.log(`[Upload] Executing tool: ${fc.name}`, JSON.stringify(fc.args).substring(0, 200));

      try {
        const result = await executeFunctionCall(fc.name, fc.args, userId);
        actions.push({ type: fc.name, data: result });
        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: { result: JSON.stringify(result) },
          },
        });
      } catch (error: any) {
        console.error(`[Upload] Tool execution failed: ${fc.name}`, error.message);
        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: { error: error.message },
          },
        });
      }
    }

    // ── Step 6: Feed function results back to Gemini for final message ──
    const followUp = [
      { role: "user", parts: contentParts },
      { role: "model", parts: allParts },
      { role: "user", parts: functionResponses },
    ];

    const finalResponse = await getGenAI().models.generateContent({
      model: "gemini-2.5-pro",
      contents: followUp,
      config: {
        systemInstruction: getSystemPrompt(currentDate) + "\n\n" + getFileAnalysisPrompt(currentDate),
      },
    });

    const finalText =
      finalResponse.candidates?.[0]?.content?.parts
        ?.filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join("") || "";

    // Combine: if the initial pass had a summary, prepend it
    const reply = finalText || summary || "Done! I've analyzed the file and updated your dashboard.";

    // Save summary to the newly created goal
    const planAction = actions.find((a) => a.type === "createPlan");
    const goalAction = actions.find((a) => a.type === "createGoal");
    const newGoalId = planAction?.data?.goal?.id || goalAction?.data?.id;

    if (newGoalId && reply) {
      console.log(`[Upload] Saving AI summary to goal ${newGoalId}...`);
      try {
        await db.updateGoalSummary(newGoalId, reply);
      } catch (err: any) {
        console.error(`[Upload] Failed to save study summary to DB:`, err.message);
      }
    }

    return { reply, actions };
  } finally {
    // ── CLEANUP: Always runs, whether success or failure ──

    // 1. Delete local temp file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Upload] Local file cleaned up: ${filePath}`);
      }
    } catch (err: any) {
      console.warn(`[Upload] Failed to delete local file: ${err.message}`);
    }

    // 2. Delete remote Google file
    if (googleFileName) {
      try {
        await getGenAI().files.delete({ name: googleFileName });
        console.log(`[Upload] Google file cleaned up: ${googleFileName}`);
      } catch (err: any) {
        console.warn(`[Upload] Failed to delete Google file: ${err.message}`);
      }
    }
  }
}
