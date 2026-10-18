import { testDatabaseConnection } from "./db.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyzeResume, generateInterviewQuestion, evaluateInterviewAnswer } from "./ai.js";
const app = express();
const PORT = Number(process.env.PORT || 5000);

const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow command-line tools and health checks without an Origin header.
    if (!origin || configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Permit Vercel preview URLs for this starter; tighten this for production if desired.
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
    return callback(new Error("This website origin is not allowed by the API CORS policy."));
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "Preppilot AI API", status: "ok", endpoints: ["/api/health", "/api/resume/analyze", "/api/interview/question", "/api/interview/evaluate"] });
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiConfigured: Boolean(process.env.GROQ_API_KEY?.trim()), model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile" });
});

app.post("/api/resume/analyze", async (req, res, next) => {
  try {
    const result = await analyzeResume(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});
app.post("/api/interview/question", async (req, res, next) => {
  try {
    const result = await generateInterviewQuestion(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});
app.post("/api/interview/evaluate", async (req, res, next) => {
  try {
    const result = await evaluateInterviewAnswer(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  const status = Number(error.status) || 500;
  if (status >= 500) console.error("[API error]", error.message);
  res.status(status).json({
    success: false,
    error: status >= 500 && process.env.NODE_ENV === "production"
      ? "The AI request failed. Check the backend configuration and try again."
      : error.message || "Unexpected server error."
  });
});

app.listen(PORT, async () => {
  console.log(`Preppilot AI API running on http://localhost:${PORT}`);

  await testDatabaseConnection();
});