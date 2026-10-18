import { supabaseClient } from "./supabase.js";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function post(path, body) {
  if (!supabaseClient) throw new Error("Sign-in is not configured. Please contact the app administrator.");
  const { data, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw new Error("Could not verify your sign-in. Please sign in again.");
  const session = data.session;
  if (!session?.access_token) throw new Error("Please sign in before using this feature.");

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("Cannot reach the backend. Check that the API server is running and VITE_API_URL is correct.");
  }
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error(`The server returned an unreadable response (HTTP ${response.status}).`); }
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || `Request failed (HTTP ${response.status}).`);
  }
  if (!payload?.data || typeof payload.data !== "object") {
    throw new Error("The server returned an unexpected response format.");
  }
  return payload.data;
}

export const analyzeResume = (body) => post("/api/resume/analyze", body);
export const createQuestion = (body) => post("/api/interview/question", body);
export const evaluateAnswer = (body) => post("/api/interview/evaluate", body);

export async function getHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}
