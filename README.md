# Preppilot AI — Public-ready starter

A full-stack career preparation app with:
- AI resume feedback
- Mock interview question generation
- Interview answer feedback
- Job application tracker (saved in the browser)
- Responsive dark UI
- Demo mode when no Groq API key is configured
- Deployable frontend (Vercel) + backend (Render)

## Requirements
- Node.js 20 or newer
- Optional: Groq API key for real AI feedback

## 1. Run locally

Open two terminals.

### Backend
```bash
cd server
npm install
cp .env.example .env
# Optional: add your Groq API key to server/.env
npm run dev
```
The API runs at `http://localhost:5000`.

### Frontend
In a second terminal:
```bash
cd client
npm install
cp .env.example .env
npm run dev
```
Open the URL Vite prints (usually `http://localhost:5173`).

### Sign-in setup
Create a project at [Supabase](https://supabase.com/), then copy its Project URL and publishable/anon key into `client/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```
In Supabase Authentication settings, enable email/password sign-in, set the local Site URL to `http://localhost:5173`, and add that URL to the allowed redirect URLs. Configure the deployed frontend URL there as well. The app requires a verified Supabase session before opening the workspace. Job applications remain in local browser storage and are separated by signed-in account on that browser; they are not uploaded to Supabase.

The backend also requires the same Supabase Project URL and publishable/anon key as `SUPABASE_URL` and `SUPABASE_ANON_KEY`. AI endpoints reject unauthenticated requests and validate each signed-in user's access token with Supabase. Do not use a Supabase service-role key in the browser or expose it in deployment logs.

On Windows PowerShell, if `cp` is unavailable:
```powershell
Copy-Item .env.example .env
```

## 2. Enable real AI

1. Create/check a Groq API key at https://console.groq.com/keys.
2. Put it in `server/.env`:
```env
GROQ_API_KEY=your_actual_key
GROQ_MODEL=llama-3.3-70b-versatile
```
3. Restart the backend.

Never put the key in `client/.env`, frontend source code, GitHub, or this chat. Groq API availability, model availability, and free usage limits are controlled by Groq.

Without a key, the app returns clearly labeled demo feedback so you can test the UI.

## 3. Publish online

### Backend on Render
1. Push this project to a GitHub repository.
2. In Render, create a **Web Service** from that repository.
3. Set **Root Directory** to `server`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables:
   - `GROQ_API_KEY` = your private key (optional, but required for real AI)
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `CLIENT_ORIGIN` = your deployed Vercel URL, e.g. `https://your-app.vercel.app`
   - `SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_ANON_KEY` = Supabase publishable/anon key
   - `NODE_ENV` = `production`
7. Deploy and copy the Render service URL, e.g. `https://your-api.onrender.com`.

### Frontend on Vercel
1. Import the same GitHub repository in Vercel.
2. Set **Root Directory** to `client`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` = your Render URL, e.g. `https://your-api.onrender.com`
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase publishable/anon key
6. Deploy.

For a Render static-site frontend, use root directory `client`, build command `npm install && npm run build`, publish directory `dist`, and set `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. Set the deployed frontend URL in the Supabase allowed redirect URLs and set `CLIENT_ORIGIN` on the Render API to that frontend URL.

If you deploy the frontend before the backend, you can update `VITE_API_URL` later and redeploy. Add the exact Vercel URL to Render's `CLIENT_ORIGIN`. For preview deployments, either configure allowed origins in the backend or use the production URL.

## Important limitations
- The job tracker uses browser localStorage; data is not shared across devices and is not a server database.
- Supabase provides email/password accounts and the backend validates access tokens, but the starter does not include cloud-persisted user data, rate limiting, or privacy terms. Add these before handling sensitive or high-volume production workloads.
- Resume text is sent to the AI provider when real AI mode is enabled. Avoid including unnecessary sensitive personal information.
