import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  })
  : null;

export const authConfigured = Boolean(supabase);

export async function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: "Authentication is not configured on the API."
    });
  }

  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({
      success: false,
      error: "Please sign in to use this feature."
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: "Your sign-in has expired. Please sign in again."
      });
    }

    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
}
