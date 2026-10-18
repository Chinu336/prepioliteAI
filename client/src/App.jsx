import { useEffect, useMemo, useState } from "react";
import { analyzeResume, createQuestion, evaluateAnswer, getHealth } from "./api.js";

const starterResume = `Chinmay Agashe
Computer Science student | CSE (IoT)
Skills: Java, Python, JavaScript, React, Node.js, SQL
Projects:
- Preppilot AI: Built a career preparation web app using React and Node.js.
- Expense Tracker: Created a Java and MySQL application to record expenses.
Education: B.Tech Computer Science and Engineering (IoT)`;

function readJobs(userId) {
  try { return JSON.parse(localStorage.getItem(`preppilot-jobs:${userId}`) || "[]"); } catch { return []; }
}

export function Workspace({ user, onSignOut }) {
  const [active, setActive] = useState("resume");
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeResult, setResumeResult] = useState(null);
  const [role, setRole] = useState("Software Developer");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [topic, setTopic] = useState("JavaScript and web development");
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState(null);
  const [jobs, setJobs] = useState(() => readJobs(user.id));
  const [jobForm, setJobForm] = useState({ company: "", role: "", status: "Applied", link: "" });

  useEffect(() => { getHealth().then(setHealth); }, []);
  useEffect(() => { localStorage.setItem(`preppilot-jobs:${user.id}`, JSON.stringify(jobs)); }, [jobs, user.id]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }, []);

  async function run(action) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); }
    catch (e) { setError(e.message || "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function onResumeSubmit(e) {
    e.preventDefault();
    await run(async () => {
      const result = await analyzeResume({ resumeText, targetRole, jobDescription });
      setResumeResult(result);
      setNotice(result.mode === "demo" ? "Demo mode is active. Add a Groq key to enable AI-generated feedback." : "AI feedback generated successfully.");
    });
  }

  async function onQuestionSubmit(e) {
    e.preventDefault();
    await run(async () => {
      const result = await createQuestion({ role, difficulty, topic });
      setQuestion(result); setAnswer(""); setAnswerResult(null);
      setNotice(result.mode === "demo" ? "A practice question was created in demo mode." : "Your interview question is ready.");
    });
  }

  async function onEvaluate(e) {
    e.preventDefault();
    await run(async () => {
      const result = await evaluateAnswer({ role, question: question?.question, answer });
      setAnswerResult(result);
    });
  }

  function addJob(e) {
    e.preventDefault();
    if (!jobForm.company.trim() || !jobForm.role.trim()) return;
    setJobs((old) => [{ ...jobForm, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...old]);
    setJobForm({ company: "", role: "", status: "Applied", link: "" });
    setNotice("Job application saved in this browser.");
  }

  function updateJob(id, status) {
    setJobs((old) => old.map((job) => job.id === id ? { ...job, status } : job));
  }

  async function loadTextFile(file) {
    if (!file) return;
    if (file.size > 1_000_000) { setError("Please choose a text file smaller than 1 MB."); return; }
    const text = await file.text();
    setResumeText(text);
    setError("");
    setNotice("Text file loaded. Review it before analyzing.");
  }

  const nav = [
    ["resume", "▤", "Resume analyzer"],
    ["interview", "✳", "Mock interview"],
    ["tracker", "▣", "Job tracker"]
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setActive("resume")}>
          <span className="brand-icon">✦</span><span>preppilot<span className="brand-ai">.ai</span><small>YOUR CAREER COPILOT</small></span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([id, icon, label]) => (
            <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => { setActive(id); setError(""); setNotice(""); }}>
              <span className="nav-icon">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-orb">✧</div>
          <strong>Small steps. Big career moves.</strong>
          <p>Build confidence one practice at a time.</p>
          <span className={`connection ${health?.aiConfigured ? "connected" : ""}`}><i />{health?.aiConfigured ? "AI provider configured" : "Demo-ready mode"}</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{nav.find((x) => x[0] === active)?.[2]}</strong></div>
          <div className="top-right"><span className="status-pill"><i />{health?.aiConfigured ? "AI connected" : "Learning mode"}</span><span className="user-email">{user.email}</span><button className="sign-out-button" onClick={onSignOut}>Sign out</button></div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div><div className="eyebrow">{greeting.toUpperCase()} · LET'S MAKE PROGRESS</div><h1>{active === "resume" ? "Your next opportunity starts here." : active === "interview" ? "Practice makes prepared." : "Keep every opportunity in view."}</h1><p className="subheading">{active === "resume" ? "Get clear, practical feedback to make your resume stand out." : active === "interview" ? "Build confidence with focused questions and constructive feedback." : "A simple space to keep track of the roles you're pursuing."}</p></div>
          </div>

          {error && <div className="alert error"><span>⚠</span><div><strong>Something needs attention</strong><p>{error}</p></div><button onClick={() => setError("")}>×</button></div>}
          {notice && <div className="alert info"><span>✓</span><p>{notice}</p><button onClick={() => setNotice("")}>×</button></div>}

          {active === "resume" && <section className="layout-grid">
            <div className="panel form-panel">
              <div className="panel-heading"><div className="heading-icon">▤</div><div><h2>Resume analyzer</h2><p>Get actionable feedback tailored to your goal.</p></div></div>
              <form onSubmit={onResumeSubmit}>
                <label>Target role <span className="optional">RECOMMENDED</span></label>
                <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Frontend Developer" maxLength={200} />
                <label>Job description <span className="optional">OPTIONAL</span></label>
                <textarea className="small-textarea" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description to tailor your feedback..." maxLength={5000} />
                <div className="label-row"><label>Your resume text</label><label className="upload-button">↥ Load .txt file<input type="file" accept=".txt,text/plain" onChange={(e) => loadTextFile(e.target.files?.[0])} /></label></div>
                <textarea className="resume-textarea" value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume here: education, skills, projects, experience..." required minLength={30} maxLength={12000} />
                <div className="field-foot"><span>{resumeText.length.toLocaleString()} / 12,000 characters</span><button className="text-button" type="button" onClick={() => setResumeText(starterResume)}>Load sample resume</button></div>
                <button className="primary-button full" disabled={busy || resumeText.trim().length < 30}>{busy ? <><span className="spinner" /> Analyzing...</> : <>✦ Analyze my resume <span>→</span></>}</button>
              </form>
              <p className="privacy-note">🔒 Review your resume before submitting. Avoid unnecessary sensitive personal information.</p>
            </div>
            <div className="result-column">
              {!resumeResult ? <div className="empty-result panel"><div className="empty-art"><span>✧</span><b>✦</b></div><h2>Your feedback, at a glance.</h2><p>Run an analysis to see your strengths, improvement areas, and suggested next steps here.</p><div className="result-preview"><span>01</span> Strengths & opportunities</div><div className="result-preview"><span>02</span> Practical improvements</div><div className="result-preview"><span>03</span> Suggested skills</div></div> : <div className="panel result-panel">
                <div className="result-title"><div><span className="eyebrow">YOUR REVIEW</span><h2>Resume insights</h2></div><span className={`mode-tag ${resumeResult.mode === "demo" ? "demo" : ""}`}>{resumeResult.mode === "demo" ? "DEMO" : "AI GENERATED"}</span></div>
                <div className="summary-box"><strong>Summary</strong><p>{resumeResult.summary}</p></div>
                <ResultList title="What's working" items={resumeResult.strengths} icon="✓" />
                <ResultList title="What to improve" items={resumeResult.improvements} icon="↗" />
                <ResultList title="Suggested next steps" items={resumeResult.suggestedSkills} icon="✦" />
                <p className="disclaimer">{resumeResult.disclaimer}</p>
              </div>}
              <div className="tip-card"><span>✧</span><div><strong>Make it measurable</strong><p>When truthful, include the impact of your work: time saved, users supported, or performance improved.</p></div></div>
            </div>
          </section>}

          {active === "interview" && <section className="interview-grid">
            <div className="panel form-panel">
              <div className="panel-heading"><div className="heading-icon">✳</div><div><h2>Mock interview</h2><p>Generate a question for focused practice.</p></div></div>
              <form onSubmit={onQuestionSubmit}>
                <label>Target role</label><input value={role} onChange={(e) => setRole(e.target.value)} maxLength={200} />
                <label>Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
                <label>Topic</label><input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} />
                <button className="primary-button full" disabled={busy}>{busy ? "Preparing..." : "✦ Generate interview question →"}</button>
              </form>
            </div>
            <div className="panel interview-result">
              {!question ? <div className="empty-art"><span>✧</span><b>?</b></div> : <>
                <span className="eyebrow">PRACTICE QUESTION</span><h2>{question.question}</h2>
                <h3>What to demonstrate</h3><ul>{question.evaluationPoints.map((x, i) => <li key={i}>{x}</li>)}</ul>
                <form onSubmit={onEvaluate}>
                  <label>Your answer</label><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer here..." minLength={5} maxLength={6000} required />
                  <button className="primary-button full" disabled={busy || answer.trim().length < 5}>{busy ? "Reviewing..." : "Get answer feedback →"}</button>
                </form>
                {answerResult && <div className="answer-feedback"><div className="rating">Practice rating <strong>{answerResult.rating}/5</strong></div><ResultList title="What went well" items={answerResult.whatWentWell} icon="✓" /><ResultList title="Try next time" items={answerResult.improvements} icon="↗" /><h3>Stronger answer outline</h3><p>{answerResult.strongerAnswer}</p><span className="mode-tag">{answerResult.mode === "demo" ? "DEMO FEEDBACK" : "AI FEEDBACK"}</span></div>}
              </>}
            </div>
          </section>}

          {active === "tracker" && <section className="tracker-layout">
            <div className="panel form-panel">
              <div className="panel-heading"><div className="heading-icon">▣</div><div><h2>Add an application</h2><p>Keep your job search organized.</p></div></div>
              <form onSubmit={addJob}>
                <label>Company</label><input value={jobForm.company} onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} placeholder="Company name" required maxLength={150} />
                <label>Role</label><input value={jobForm.role} onChange={(e) => setJobForm({ ...jobForm, role: e.target.value })} placeholder="Job title" required maxLength={150} />
                <label>Status</label><select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}><option>Interested</option><option>Applied</option><option>Assessment</option><option>Interview</option><option>Offer</option><option>Rejected</option></select>
                <label>Job link <span className="optional">OPTIONAL</span></label><input type="url" value={jobForm.link} onChange={(e) => setJobForm({ ...jobForm, link: e.target.value })} placeholder="https://..." />
                <button className="primary-button full">+ Save application</button>
              </form>
            </div>
            <div className="panel jobs-panel"><div className="result-title"><div><span className="eyebrow">YOUR PIPELINE</span><h2>Job applications <span className="count">{jobs.length}</span></h2></div><button className="text-button" onClick={() => { if (confirm("Clear all saved applications from this browser?")) setJobs([]); }}>Clear all</button></div>
              {!jobs.length ? <div className="empty-jobs"><div className="empty-art"><span>✧</span><b>▣</b></div><h3>No applications yet</h3><p>Add your first opportunity. Your list is saved locally in this browser.</p></div> : <div className="job-list">{jobs.map((job) => <article className="job-row" key={job.id}><div className="company-avatar">{job.company.slice(0, 1).toUpperCase()}</div><div className="job-info"><strong>{job.role}</strong><span>{job.company}</span>{job.link && <a href={job.link} target="_blank" rel="noreferrer">Open job posting ↗</a>}</div><select aria-label={`Status for ${job.company}`} value={job.status} onChange={(e) => updateJob(job.id, e.target.value)}><option>Interested</option><option>Applied</option><option>Assessment</option><option>Interview</option><option>Offer</option><option>Rejected</option></select><button className="remove-job" aria-label="Remove application" onClick={() => setJobs((old) => old.filter((x) => x.id !== job.id))}>×</button></article>)}</div>}
            </div>
          </section>}

          <footer className="footer"><span>✦ preppilot.ai</span><span>Built for your next career move.</span><span>Career guidance, not a hiring decision.</span></footer>
        </div>
      </main>
    </div>
  );
}

function ResultList({ title, items = [], icon }) {
  return <section className="result-list"><h3><span>{icon}</span>{title}</h3><ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>;
}
