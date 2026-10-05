import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { emptyResume, hydrateResume, downloadResume, jsonOptions, resumeRequest } from '../lib/resumeApi';
import SavedResumes from '../components/resume/SavedResumes';
import ProjectLinksEditor from '../components/resume/ProjectLinksEditor';
import CvPhotoUpload from '../components/resume/CvPhotoUpload';
import ResumePreview from '../components/resume/ResumePreview';
import TemplatePicker from '../components/resume/TemplatePicker';
const sections = ['personal', 'skills', 'projects', 'experience', 'education', 'certifications', 'languages', 'review'];
const labels = {
  personal: 'Contact & summary',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  languages: 'Languages',
  review: 'Review & export'
};
const configs = {
  personal: [['name', 'Full name', 'Your full name'], ['title', 'Professional title', 'Frontend Developer'], ['email', 'Email', 'you@example.com', 'email'], ['phone', 'Phone', '+880…'], ['location', 'Location', 'Dhaka, Bangladesh'], ['linkedin', 'LinkedIn URL', 'https://linkedin.com/in/…', 'url'], ['website', 'Portfolio URL', 'https://…', 'url'], ['github', 'GitHub URL', 'https://github.com/…', 'url'], ['summary', 'Career objective / summary', 'Write 2–3 sentences: your role, relevant skills and the value you offer.', 'textarea']],
  skills: [['name', 'Skills (comma-separated within a group)', 'React, Next.js, TypeScript'], ['category', 'Category', 'Frontend / Backend / Database / Tools']],
  projects: [['name', 'Project name', 'Project name'], ['role', 'Your role', 'Full Stack Developer'], ['description', 'Project overview', 'Explain the problem and users in 1–2 sentences.', 'textarea'], ['achievements', 'Achievements — one bullet per line', 'Built…\nImplemented…\nImproved… (use real metrics when available)', 'textarea'], ['technologies', 'Tech stack', 'React, Express, MongoDB']],
  experience: [['position', 'Position', 'Frontend Developer'], ['company', 'Company', 'Company name'], ['duration', 'Dates', 'Jan 2025 – Present'], ['description', 'Achievements — one bullet per line', 'Write 3–5 bullets: action + what you did + outcome.', 'textarea']],
  education: [['degree', 'Degree', 'B.Sc. Honours'], ['institution', 'Institution', 'Dhaka College'], ['field', 'Field of study', 'Mathematics'], ['duration', 'Dates / expected graduation', '2022 – Present (Expected: 2026)'], ['gpa', 'GPA (optional)', '3.50 / 4.00']],
  certifications: [['name', 'Certificate name', 'Course / certification name'], ['issuer', 'Issuer', 'Issuing organization'], ['date', 'Date', '2025'], ['url', 'Credential URL', 'https://…', 'url']],
  languages: [['name', 'Language', 'English'], ['proficiency', 'Proficiency', 'Native / Fluent / Intermediate']]
};
const tips = {
  personal: 'Include your name, target title, email, phone and city. Aim for a 40–70 word summary using real skills.',
  skills: 'Aim for 8–16 relevant skills across 3–4 groups. Select tools you can demonstrate in an interview.',
  projects: 'For an entry-level resume, aim for 2–3 relevant projects. Add your role, stack, links and 3–5 achievement bullets per project.',
  experience: 'Add relevant paid work, internships or volunteering. Aim for 3–5 achievement bullets per role. Skip this section if you have no experience.',
  education: 'Add at least your most relevant degree, institution and dates. Current students can include expected graduation.',
  certifications: 'Add 1–3 relevant certificates if you have them. This section is optional.',
  languages: 'List languages and honest proficiency levels. This section is optional.'
};
function Field({
  section,
  index,
  spec,
  value,
  onChange,
  disabled
}) {
  const [key, label, placeholder, type = 'text'] = spec;
  const id = `${section}-${index}-${key}`;
  const props = {
    id,
    disabled,
    value: value || '',
    onChange: e => onChange(key, e.target.value),
    placeholder,
    maxLength: type === 'textarea' ? 4000 : 500,
    className: 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  };
  return <div className={type === 'textarea' ? 'sm:col-span-2' : ''}><label htmlFor={id} className="text-sm font-medium">{label}</label>{type === 'textarea' ? <textarea {...props} rows={key === 'achievements' || key === 'description' ? 5 : 4} /> : <input {...props} type={type} />}</div>;
}
function readiness(data) {
  const required = [];
  if (!data.personal.name.trim()) required.push('Full name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal.email)) required.push('Valid email');
  if (!data.personal.title.trim()) required.push('Professional title');
  if (!data.personal.summary.trim()) required.push('Summary');
  if (!data.skills.some(s => s.name?.trim())) required.push('Skills');
  if (!data.education.some(e => e.degree?.trim() && e.institution?.trim())) required.push('Education');
  if (!data.projects.some(p => p.name?.trim() && p.description?.trim()) && !data.experience.some(e => e.position?.trim() && e.company?.trim() && e.description?.trim())) required.push('Project or experience');
  return required;
}
export default function ResumeBuilder({ mode = 'resume' }) {
  const {
    user
  } = useAuth();
  const [params, setParams] = useSearchParams();
  const reducedMotion = useReducedMotion();
  const [data, setData] = useState(() => emptyResume(user, mode));
  const [editingId, setEditingId] = useState(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const documentLabel = mode === 'cv' ? 'CV' : 'Resume';
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const lastLoaded = useRef('');
  const section = sections[step];
  const missing = readiness(data);
  useEffect(() => {
    const id = params.get('resume');
    if (!id || id === lastLoaded.current || !user) return;
    let ignore = false;
    setBusy(true);
    resumeRequest(`/api/resumes/${id}`).then(resume => {
      if (!ignore) {
        lastLoaded.current = id;
        if ((resume.documentType || 'resume') !== mode) throw new Error('Open this document in its correct Resume or CV builder.');
        setData(hydrateResume(resume, user, mode));
        setEditingId(resume._id);
        setDirty(false);
        setStep(0);
      }
    }).catch(e => {
      if (!ignore) setError(e.message);
    }).finally(() => {
      if (!ignore) setBusy(false);
    });
    return () => {
      ignore = true;
    };
  }, [params, user, mode]);
  useEffect(() => {
    const handler = e => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const change = updater => {
    setData(updater);
    setDirty(true);
    setError('');
  };
  const update = (key, value, index) => change(prev => index === undefined ? {
    ...prev,
    personal: {
      ...prev.personal,
      [key]: value
    }
  } : {
    ...prev,
    [section]: prev[section].map((item, i) => i === index ? {
      ...item,
      [key]: value
    } : item)
  });
  function load(resume) {
    if (busy || photoBusy) return;
    if (dirty && !window.confirm('Discard unsaved changes and open this resume?')) return;
    lastLoaded.current = resume._id;
    setParams({
      resume: resume._id
    });
    setData(hydrateResume(resume, user, mode));
    setEditingId(resume._id);
    setStep(0);
    setDirty(false);
    setError('');
  }
  function fresh() {
    if (dirty && !window.confirm('Discard unsaved changes and create a new resume?')) return;
    lastLoaded.current = '';
    setParams({});
    setEditingId(null);
    setData(emptyResume(user, mode));
    setStep(0);
    setDirty(false);
    setError('');
  }
  async function persist(copy = false) {
    const result = await resumeRequest(editingId && !copy ? `/api/resumes/${editingId}` : '/api/resumes', jsonOptions(editingId && !copy ? 'PUT' : 'POST', data));
    const id = String(result.id);
    lastLoaded.current = id;
    setEditingId(id);
    setParams({
      resume: id
    });
    setDirty(false);
    setRefresh(n => n + 1);
    return id;
  }
  async function action(kind) {
    setBusy(true);
    setError('');
    try {
      if (kind === 'download' && missing.length) throw new Error(`Complete: ${missing.join(', ')}.`);
      await persist(kind === 'copy');
      if (kind === 'download') await downloadResume(data);
      toast.success(kind === 'download' ? 'Saved to your profile and PDF downloaded.' : 'Resume saved to your profile.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <Motion.main initial={reducedMotion ? false : {
    opacity: 0,
    y: 12
  }} animate={{
    opacity: 1,
    y: 0
  }} className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-700">Your next opportunity</p><h1 className="text-2xl font-bold md:text-3xl">{documentLabel} Builder</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Build a compact, readable resume with guided sections and a live preview. Use English for this PDF template.</p></div><button type="button" onClick={fresh} disabled={busy || photoBusy} className="rounded-xl border border-slate-300 bg-white px-4 py-2 disabled:opacity-50">+ New {documentLabel.toLowerCase()}</button></header>
      <div className="grid items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)_minmax(320px,0.9fr)]">
        <aside className="space-y-4 xl:sticky xl:top-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="font-semibold">Build your {documentLabel.toLowerCase()}</h2><p className="mt-1 text-xs text-slate-500">Step {step + 1} of {sections.length} · {dirty ? 'Unsaved changes' : editingId ? 'Saved' : 'New draft'}</p><nav aria-label="Resume sections" className="mt-3 flex gap-2 overflow-x-auto xl:flex-col">{sections.map((s, i) => <button type="button" key={s} onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined} className={`whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm ${step === i ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{i + 1}. {labels[s]}</button>)}</nav></div>
          <SavedResumes documentType={mode} onEdit={load} refreshKey={refresh} onDelete={id => {
            if (id === editingId) {
              setEditingId(null);
              lastLoaded.current = "";
              setParams({});
              setDirty(true);
            }
          }} />
        </aside>
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <label htmlFor="resume-title" className="text-xs font-semibold text-slate-500">{documentLabel.toUpperCase()} VERSION NAME</label><input id="resume-title" disabled={busy || photoBusy} maxLength={150} value={data.title} onChange={e => change(p => ({
            ...p,
            title: e.target.value
          }))} placeholder="Frontend Developer — October 2026" className="mb-5 mt-1 w-full border-b border-slate-300 py-2 font-medium outline-none focus:border-blue-600" />
          <h2 className="text-xl font-semibold">{labels[section]}</h2>
          {tips[section] && <p className="my-3 rounded-xl bg-blue-50 p-3 text-sm leading-relaxed text-blue-900">{tips[section]}</p>}
          {section === 'personal' && mode === 'cv' && <CvPhotoUpload value={data.photoUrl} disabled={busy || photoBusy} onBusy={setPhotoBusy} onChange={value => change(prev => ({ ...prev, photoUrl: value }))} />}
          {section === 'personal' && <div className="grid gap-4 sm:grid-cols-2">{configs.personal.map(spec => <Field disabled={busy || photoBusy} key={spec[0]} section={section} spec={spec} value={data.personal[spec[0]]} onChange={(key, value) => update(key, value)} />)}</div>}
          {configs[section] && section !== 'personal' && <div className="space-y-4">{!data[section].length && <p className="py-4 text-sm text-slate-500">No {labels[section].toLowerCase()} added yet.</p>}{data[section].map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{labels[section]} {index + 1}</h3><button type="button" disabled={busy || photoBusy} onClick={() => change(prev => ({
                  ...prev,
                  [section]: prev[section].filter((_, i) => i !== index)
                }))} aria-label={`Remove ${labels[section]} ${index + 1}`} className="text-sm text-red-700">Remove</button></div><div className="grid gap-4 sm:grid-cols-2">{configs[section].map(spec => <Field disabled={busy || photoBusy} key={spec[0]} section={section} index={index} spec={spec} value={item[spec[0]]} onChange={(key, value) => update(key, value, index)} />)}</div>{section === "projects" && <ProjectLinksEditor links={item.links || []} projectIndex={index} disabled={busy || photoBusy} onChange={links => update("links", links, index)} />}</div>)}<button type="button" disabled={busy || data[section].length >= 30} onClick={() => change(prev => ({
              ...prev,
              [section]: [...prev[section], { ...Object.fromEntries(configs[section].map(([key]) => [key, ''])), ...(section === 'projects' ? { links: [] } : {}) }]
            }))} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 disabled:opacity-50">+ Add {labels[section]}</button></div>}
          <TemplatePicker data={data} onChange={value => change(() => value)} />
          {section === 'review' && <div className="mt-4 space-y-5"><div className={`rounded-xl p-4 text-sm ${missing.length ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}><h3 className="font-semibold">{missing.length ? 'Before exporting' : 'Core information is ready'}</h3>{missing.length ? <ul className="mt-2 list-disc pl-5">{missing.map(m => <li key={m}>{m}</li>)}</ul> : <p className="mt-2">Check every fact and link in the preview before you download.</p>}</div><p className="text-sm text-slate-600">Aim for 1 page for early career, or 2 pages when your experience needs it. Export adds pages automatically instead of cutting content. Optional sections can be skipped; never add fictional experience to fill space.</p><button type="button" onClick={() => setPreview(true)} className="text-blue-700 xl:hidden">Show live preview</button></div>}
          <label className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" disabled={busy || photoBusy} checked={data.coachEnabled !== false} onChange={e => change(prev => ({
              ...prev,
              coachEnabled: e.target.checked
            }))} className="mt-1" /><span><strong>Use this saved {documentLabel.toLowerCase()} for AI Coach</strong><span className="mt-1 block text-xs text-slate-500">The newest enabled version provides skills, projects, achievements, education and certifications for future advice. No model training is required. Contact details are excluded from this resume context.</span></span></label>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-2"><button type="button" disabled={busy || photoBusy} onClick={() => action('save')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Working…' : editingId ? 'Update resume' : 'Save draft'}</button>{editingId && <button type="button" disabled={busy || photoBusy} onClick={() => action('copy')} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm disabled:opacity-50">Save as new version</button>}<button type="button" disabled={busy || photoBusy || missing.length > 0} onClick={() => action('download')} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white disabled:opacity-40">Save & download PDF</button></div>
          <div className="mt-6 flex justify-between border-t border-slate-100 pt-4"><button type="button" disabled={step === 0} onClick={() => setStep(s => s - 1)} className="text-sm text-slate-600 disabled:opacity-30">← Back</button><button type="button" disabled={step === sections.length - 1} onClick={() => setStep(s => s + 1)} className="text-sm font-medium text-blue-700 disabled:opacity-30">Next section →</button></div>
        </section>
        <aside className={`${preview ? 'block' : 'hidden'} min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:sticky xl:top-5 xl:block`}><div className="flex justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 text-sm"><h2 className="font-semibold">Live preview</h2><button type="button" onClick={() => setPreview(false)} className="xl:hidden">Hide</button></div><div className="max-h-[85vh] overflow-y-auto"><ResumePreview data={data} /></div><p className="border-t p-3 text-xs text-slate-500">Content preview. PDF uses A4 pages with selectable text; page breaks may differ.</p></aside>
      </div>
      <button type="button" onClick={() => setPreview(p => !p)} className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm xl:hidden">{preview ? 'Hide preview' : 'Show live preview'}</button>
    </div>
  </Motion.main>;
}
