import { useEffect, useState } from "react";
import { supabaseClient } from "./supabase.js";
import { Workspace } from "./App.jsx";

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [mode, setMode] = useState("signIn");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabaseClient) return undefined;

    let active = true;
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthReady(true);
      if (event === "PASSWORD_RECOVERY") setMode("updatePassword");
    });

    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(action) {
    setBusy(true);
    setAuthError("");
    setNotice("");
    try {
      await action();
    } catch (error) {
      setAuthError(error.message || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await handleAuth(async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    });
  }

  if (!supabaseClient) return <AuthConfigurationRequired />;
  if (!authReady) return <AuthLoading />;
  if (session && mode !== "updatePassword") {
    return <Workspace key={session.user.id} user={session.user} onSignOut={signOut} />;
  }

  return (
    <AuthScreen
      mode={mode}
      setMode={(nextMode) => { setMode(nextMode); setAuthError(""); setNotice(""); }}
      busy={busy}
      error={authError}
      notice={notice}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");

        if (mode === "signUp") {
          return handleAuth(async () => {
            const { data, error } = await supabaseClient.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin }
            });
            if (error) throw error;
            if (data.session) setSession(data.session);
            else setNotice("Check your email for a confirmation link to finish creating your account.");
          });
        }

        if (mode === "reset") {
          return handleAuth(async () => {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin
            });
            if (error) throw error;
            setNotice("If an account exists for that email, a password reset link has been sent.");
          });
        }

        if (mode === "updatePassword") {
          return handleAuth(async () => {
            const { error } = await supabaseClient.auth.updateUser({ password });
            if (error) throw error;
            setMode("signIn");
            setNotice("Your password has been updated.");
          });
        }

        return handleAuth(async () => {
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;
          setSession(data.session);
        });
      }}
    />
  );
}

function AuthConfigurationRequired() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Brand />
        <h1>Sign-in setup required</h1>
        <p className="auth-description">Add your Supabase project URL and publishable key to the client environment to enable secure email sign-in.</p>
        <div className="auth-config">
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_ANON_KEY</code>
        </div>
        <p className="auth-help">See the “Sign-in setup” section in the project README. Then rebuild and redeploy the frontend.</p>
      </section>
    </main>
  );
}

function AuthLoading() {
  return (
    <main className="auth-page">
      <section className="auth-card auth-loading">
        <Brand />
        <p>Checking your sign-in…</p>
      </section>
    </main>
  );
}

function AuthScreen({ mode, setMode, busy, error, notice, onSubmit }) {
  const isPasswordMode = mode === "signIn" || mode === "signUp";
  const title = mode === "signUp" ? "Create your account"
    : mode === "reset" ? "Reset your password"
      : mode === "updatePassword" ? "Choose a new password"
        : "Welcome back";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Brand />
        <h1>{title}</h1>
        <p className="auth-description">
          {mode === "signUp" ? "Create an account to open your career workspace."
            : mode === "reset" ? "We’ll email you a secure password reset link."
              : mode === "updatePassword" ? "Choose a new password for your account."
                : "Sign in to continue to your career workspace."}
        </p>
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        {notice && <div className="auth-message auth-notice" role="status">{notice}</div>}
        <form className="auth-form" onSubmit={onSubmit}>
          {mode !== "updatePassword" && (
            <>
              <label htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" name="email" autoComplete="email" required maxLength={320} />
            </>
          )}
          {isPasswordMode && (
            <>
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                name="password"
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                minLength={8}
                required
              />
              {mode === "signUp" && <p className="auth-help">Use at least 8 characters.</p>}
            </>
          )}
          {mode === "updatePassword" && (
            <>
              <label htmlFor="auth-new-password">New password</label>
              <input id="auth-new-password" type="password" name="password" autoComplete="new-password" minLength={8} required />
              <p className="auth-help">Use at least 8 characters.</p>
            </>
          )}
          <button className="primary-button full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signUp" ? "Create account"
              : mode === "reset" ? "Send reset link"
                : mode === "updatePassword" ? "Update password"
                  : "Sign in"}
          </button>
        </form>
        <div className="auth-links">
          {mode === "signIn" && (
            <>
              <button onClick={() => setMode("reset")}>Forgot password?</button>
              <button onClick={() => setMode("signUp")}>Create an account</button>
            </>
          )}
          {mode !== "signIn" && mode !== "updatePassword" && (
            <button onClick={() => setMode("signIn")}>Back to sign in</button>
          )}
        </div>
        <p className="auth-footnote">Your job tracker stays in this browser and is kept separate for each signed-in account.</p>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="auth-brand">
      <span className="brand-icon">✦</span>
      <span>preppilot<span className="brand-ai">.ai</span></span>
    </div>
  );
}
