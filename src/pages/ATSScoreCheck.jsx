import { useCallback, useEffect, useRef, useState } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { resumeRequest, jsonOptions } from '../lib/resumeApi';
export default function ATSScoreCheck() {
  const {
    user
  } = useAuth();
  const reducedMotion = useReducedMotion();
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [jd, setJd] = useState('');
  const [keywords, setKeywords] = useState('');
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [links, setLinks] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const requestRef = useRef(null);
  const loadHistory = useCallback(async () => {
    if (!user?.email) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await resumeRequest(`/api/ats/history/${encodeURIComponent(user.email)}`);
      setHistory(data.scores || []);
    } catch (e) {
      setHistoryError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.email]);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  useEffect(() => () => requestRef.current?.abort(), []);
  const invalidate = () => {
    setResult(null);
    setVerified(false);
    setError('');
  };
  function selectFile(e) {
    const selected = e.target.files?.[0];
    invalidate();
    setText('');
    setWarnings([]);
    setFile(null);
    setLinks([]);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.pdf') || selected.size > 5 * 1024 * 1024) {
      setError('Select one PDF, 5 MB or smaller.');
      return;
    }
    setFile(selected);
  }
  async function extract() {
    if (!file) return;
    setBusy('extract');
    setError('');
    setResult(null);
    setText('');
    setVerified(false);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const body = new FormData();
      body.append('resume', file);
      const data = await resumeRequest('/api/ats/extract', {
        method: 'POST',
        body,
        signal: controller.signal
      });
      setText(data.text);
      setLinks(data.links || []);
      setWarnings([`${data.pageCount} page(s) extracted.`, ...(data.warnings || [])]);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setBusy('');
    }
  }
  async function analyze(e) {
    e.preventDefault();
    setBusy('score');
    setError('');
    setResult(null);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const data = await resumeRequest('/api/ats/check-score', {
        ...jsonOptions('POST', {
          resumeText: text,
          jobDescription: jd,
          targetKeywords: keywords, links,
          fileName: file?.name || 'Pasted / reviewed resume'
        }),
        signal: controller.signal
      });
      setResult(data);
      loadHistory();
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setBusy('');
    }
  }
  async function openHistory(item) {
    setBusy('history');
    setError('');
    try {
      const data = await resumeRequest(`/api/ats/score/${item.id}`);
      setResult(data.score);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }
  const control = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60';
  return <Motion.main initial={reducedMotion ? false : {
    opacity: 0,
    y: 12
  }} animate={{
    opacity: 1,
    y: 0
  }} className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
    <div className="mx-auto max-w-7xl">
      <header className="mb-6"><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-700">Understand your resume</p><h1 className="text-2xl font-bold md:text-3xl">ATS Resume Checker</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Extract → verify → analyze. Every point is calculated from your submitted text using visible rules. No sample or random scores.</p></header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={analyze} className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <section><h2 className="text-lg font-semibold">1. Upload or paste your resume</h2><p className="mt-1 text-sm text-slate-500">Text-based PDF only, up to 5 MB. For scans, run OCR separately or paste verified text.</p><label htmlFor="resume-upload" className="mt-4 block text-sm font-medium">Resume PDF</label><input id="resume-upload" type="file" accept="application/pdf,.pdf" onChange={selectFile} disabled={!!busy} className={`${control} file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700`} /><button type="button" onClick={extract} disabled={!file || !!busy} className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">{busy === 'extract' ? 'Reading PDF…' : 'Extract PDF text'}</button></section>
          <section><h2 className="text-lg font-semibold">2. Verify the text we will score</h2>{warnings.length > 0 && <ul className="my-3 list-disc rounded-xl bg-amber-50 p-4 pl-8 text-xs leading-relaxed text-amber-900">{warnings.map(w => <li key={w}>{w}</li>)}</ul>}{links.length > 0 && <details className="mb-3 rounded-xl bg-blue-50 p-3"><summary className="cursor-pointer text-sm font-medium text-blue-800">{links.length} hyperlink targets read from PDF</summary><ul className="mt-2 space-y-2 text-xs">{links.map((link, i) => <li key={i} className="break-all">Page {link.page}: <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-800 underline">{link.url}</a></li>)}</ul></details>}<label htmlFor="resume-text" className="mt-3 block text-sm font-medium">Resume text — editable</label><textarea id="resume-text" rows={14} maxLength={60000} disabled={!!busy} value={text} onChange={e => {
              setText(e.target.value);
              invalidate();
              setFile(null);
              setWarnings([]);
            }} placeholder="Paste your full resume here, or extract a PDF above. Keep section headings on separate lines." className={control} /><p className="mt-1 text-xs text-slate-500">{text.trim() ? text.trim().split(/\s+/).length : 0} words · {text.length.toLocaleString()} / 60,000 characters</p><label className="mt-3 flex items-start gap-3 text-sm"><input type="checkbox" checked={verified} disabled={!text.trim() || !!busy} onChange={e => setVerified(e.target.checked)} className="mt-1" /><span>I checked that this includes all pages, correct words, dates and section order.</span></label></section>
          <section><h2 className="text-lg font-semibold">3. Match a target role (optional)</h2><label htmlFor="job-description" className="mt-3 block text-sm font-medium">Job description</label><textarea id="job-description" rows={6} maxLength={10000} disabled={!!busy} value={jd} onChange={e => {
              setJd(e.target.value);
              setResult(null);
            }} placeholder="Paste the real job description for a targeted comparison." className={control} /><label htmlFor="target-keywords" className="mt-4 block text-sm font-medium">Important job terms (optional)</label><textarea id="target-keywords" rows={2} maxLength={2000} disabled={!!busy} value={keywords} onChange={e => {
              setKeywords(e.target.value);
              setResult(null);
            }} placeholder="React, TypeScript, REST API, PostgreSQL" className={control} /><p className="mt-2 text-xs leading-relaxed text-slate-500">Comma-separated terms, up to 40. Otherwise we select up to 40 frequent terms from the job description. Review them in the result: automatic selection can include irrelevant terms. With no target, keyword points are excluded.</p></section>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={!verified || !text.trim() || !!busy} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-40">{busy === 'score' ? 'Calculating from your text…' : 'Analyze verified text'}</button>
        </form>
        <div className="min-w-0 space-y-5">
          {!result ? <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">Your analysis appears here</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">See contact checks, standard headings, action verbs, measurable impact, dates, length and target keyword coverage. Each check includes the text that earned its points.</p><p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">This is a transparent text-readiness estimate. Different employers use different ATS systems; a score cannot guarantee parsing or selection.</p></section> : <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{result.assessmentType || 'Previous analysis'}</h2><p className="mt-1 text-xs text-slate-500">{result.method || 'Legacy AI estimate'} · {result.wordCount ? `${result.wordCount} words` : 'Historical report'}</p></div><div className="rounded-2xl bg-blue-50 px-5 py-3 text-blue-800"><span className="text-4xl font-bold">{result.score}</span><span className="text-sm"> / 100</span></div></div>
            {!['transparent-rules-v1', 'transparent-rules-v2'].includes(result.method) && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This historical result used the previous scoring method. Run a new analysis for a rule-by-rule breakdown.</p>}
            {result.checks && <div className="mt-5 space-y-3"><h3 className="font-semibold">Score breakdown · {result.rawPoints}/{result.maxPoints} raw points</h3>{result.checks.map(check => <article key={check.label} className="rounded-xl border border-slate-200 p-3"><div className="flex justify-between gap-3 text-sm"><h4 className="font-medium">{check.label}</h4><strong className={check.points === check.max ? 'text-emerald-700' : 'text-amber-700'}>{check.points}/{check.max}</strong></div><p className="mt-2 break-words text-xs leading-relaxed text-slate-600">Evidence: {check.evidence}</p>{check.advice && <p className="mt-2 text-xs text-blue-800">{check.advice}</p>}</article>)}</div>}
            {result.keywords && <div className="mt-5"><h3 className="font-semibold">Target keyword coverage</h3><p className="my-2 text-xs text-slate-500">{result.keywordSource || 'Previous analysis'}</p>{['found', 'missing'].map(type => <div key={type} className="mt-3"><h4 className="text-sm font-medium capitalize">{type}</h4><div className="mt-2 flex flex-wrap gap-2">{(result.keywords[type] || []).map(k => <span key={k} className={`break-all rounded-lg px-2 py-1 text-xs ${type === 'found' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{k}</span>)}{!result.keywords[type]?.length && <p className="text-xs text-slate-500">{result.keywordSource === 'No target supplied' ? 'No target supplied.' : 'None.'}</p>}</div></div>)}<p className="mt-3 text-xs text-slate-500">Only add terms you can support with real skills or experience.</p></div>}
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{result.limitations || 'Historical AI estimate. This is not an employer ATS score.'}</p>
            {result.resumeText && <details className="mt-4"><summary className="cursor-pointer text-sm text-blue-700">Exact text used for this score</summary><pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs">{result.resumeText}</pre></details>}
          </section>}
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">Analysis history</h2><button type="button" onClick={loadHistory} disabled={historyLoading} className="text-sm text-blue-700">Refresh</button></div>{historyLoading && <p className="mt-3 text-sm" role="status">Loading history…</p>}{historyError && <p role="alert" className="mt-3 text-sm text-red-700">{historyError}</p>}{!historyLoading && !historyError && !history.length && <p className="mt-3 text-sm text-slate-500">Your analyses are saved privately here.</p>}<div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{history.map(item => <button key={item.id} type="button" disabled={!!busy} onClick={() => openHistory(item)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left disabled:opacity-40"><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.fileName}</span><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()} · {item.method === 'transparent-rules-v2' ? 'Rules v2 + links' : item.method ? 'Rules v1' : 'Legacy'}</span></span><strong>{item.score}/100</strong></button>)}</div></section>
        </div>
      </div>
    </div>
  </Motion.main>;
}
