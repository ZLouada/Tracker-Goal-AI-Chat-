import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { handleChat } from "./chat.js";
import { upload, handleFileUpload } from "./upload.js";

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// ─── Health Check ───
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Chat Endpoint (text only) ───
app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId, history = [] } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: "message and userId are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    console.log(`[Chat] User ${userId}: "${message}"`);

    const result = await handleChat(userId, message, history);

    console.log(`[Chat] Response: ${result.actions.length} action(s) taken`);

    return res.json(result);
  } catch (error: any) {
    console.error("[Chat] Error:", error.message);
    return res.status(500).json({
      error: "Failed to process your message. Please try again.",
      details: error.message,
    });
  }
});

// ─── File Upload + Analysis Endpoint ───
app.post("/api/chat/upload", upload.single("file"), async (req, res) => {
  try {
    const userId = req.body.userId;
    const message = req.body.message || "";
    const file = req.file;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    console.log(`[Upload] User ${userId}: file="${file.originalname}" (${file.mimetype}, ${(file.size / 1024).toFixed(1)}KB)`);

    const result = await handleFileUpload(
      userId,
      message,
      file.path,
      file.originalname,
      file.mimetype,
    );

    console.log(`[Upload] Response: ${result.actions.length} action(s) taken`);

    return res.json(result);
  } catch (error: any) {
    console.error("[Upload] Error:", error.message);
    return res.status(500).json({
      error: "Failed to analyze the uploaded file. Please try again.",
      details: error.message,
    });
  }
});

// ─── Multer error handler ───
app.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof Error && err.message.includes("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 20MB." });
  }
  next(err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

// Serve static files from the Vite build directory
app.use(express.static(distPath));

// Fallback: serve index.html for all non-API requests (client-side routing)
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      next();
    }
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🤖 TrackerGoal AI Server running on http://localhost:${PORT}`);
    console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? "✅ configured" : "❌ MISSING"}`);
    console.log(`   Supabase URL:   ${process.env.VITE_SUPABASE_URL ? "✅ configured" : "❌ MISSING"}\n`);
  });
}

export default app;
