import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { downloadResume, resumeRequest } from '../../lib/resumeApi';
import toast from 'react-hot-toast';
export default function SavedResumes({
  onEdit,
  onDelete,
  documentType,
  refreshKey = 0
}) {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    if (!user?.uid) {
      setResumes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await resumeRequest(`/api/resumes/user/${encodeURIComponent(user.uid)}`);
      setResumes(Array.isArray(data) ? data.filter(doc => !documentType || (doc.documentType || "resume") === documentType) : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, documentType]);
  useEffect(() => {
    load();
  }, [load, refreshKey]);
  async function download(resume) {
    setBusy(resume._id);
    try {
      await downloadResume(resume);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  }
  async function remove(resume) {
    if (!window.confirm(`Delete "${resume.title || resume.personal?.name}" permanently?`)) return;
    setBusy(resume._id);
    try {
      await resumeRequest(`/api/resumes/${resume._id}`, {
        method: 'DELETE'
      });
      onDelete?.(resume._id);
      await load();
      toast.success('Resume deleted.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">My saved {documentType === "cv" ? "CVs" : documentType === "resume" ? "resumes" : "resumes & CVs"}</h2><button type="button" onClick={load} disabled={loading} className="text-sm text-blue-700 disabled:opacity-50">Refresh</button></div>
    <p className="my-2 text-sm text-slate-500">Private to your account. Edit, download or create a version for each role.</p>
    {loading && <p role="status" className="py-4">Loading resumes…</p>}
    {error && <p role="alert" className="py-3 text-red-700">{error}</p>}
    {!loading && !error && !resumes.length && <p className="py-4 text-sm">No saved resumes yet.</p>}
    <div className="max-h-[420px] space-y-3 overflow-y-auto">
      {resumes.map(resume => <article key={resume._id} className="rounded-xl border border-slate-200 p-3">
        <h3 className="break-words font-medium">{resume.title || resume.personal?.name || 'Untitled resume'}</h3>
        <p className="mt-1 text-xs text-slate-500">{resume.documentType === "cv" ? "CV" : "Resume"} · Updated {new Date(resume.updatedAt).toLocaleDateString()} · Coach {resume.coachEnabled === false ? 'disabled' : 'enabled'}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <button type="button" disabled={!!busy} className="text-blue-700 disabled:opacity-50" onClick={() => onEdit ? onEdit(resume) : navigate(`/${resume.documentType === "cv" ? "create-cv" : "create-resume"}?resume=${resume._id}`)}>Edit</button>
          <button type="button" disabled={!!busy} className="text-blue-700 disabled:opacity-50" onClick={() => download(resume)}>Download PDF</button>
          <button type="button" disabled={!!busy} className="text-red-700 disabled:opacity-50" onClick={() => remove(resume)}>Delete</button>
        </div>
      </article>)}
    </div>
    {!onEdit && <button type="button" onClick={() => navigate('/create-resume')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white">Create resume</button>}
    {!onEdit && <button type="button" onClick={() => navigate("/create-cv")} className="ml-2 mt-4 rounded-xl border border-blue-300 px-4 py-2 text-blue-700">Create CV</button>}
  </section>;
}
