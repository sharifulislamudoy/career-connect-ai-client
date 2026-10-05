import { useRef, useState, useEffect } from 'react';
export default function CvPhotoUpload({ value, onChange, disabled, onBusy }) {
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) { setError('Choose a JPG, PNG or WebP photo up to 3 MB.'); return; }
    setLoading(true); onBusy?.(true);
    controller.current = new AbortController(); const timer = setTimeout(() => controller.current.abort(), 30000);
    try {
      const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dohhfubsa';
      const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'react_unsigned';
      const form = new FormData(); form.append('file', file); form.append('upload_preset', preset);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, { method: 'POST', body: form, signal: controller.current.signal });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.secure_url) throw new Error(result?.error?.message || 'Photo upload failed. Check the unsigned Cloudinary preset.');
      const url = new URL(result.secure_url);
      if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || !url.pathname.startsWith(`/${cloud}/image/upload/`)) throw new Error('Cloudinary returned an unexpected image URL.');
      onChange(result.secure_url);
    } catch (e) { setError(e.name === 'AbortError' ? 'Upload stopped or timed out. Please retry.' : e.message); }
    finally { clearTimeout(timer); setLoading(false); onBusy?.(false); }
  }
  return <section className="mb-5 rounded-xl border border-slate-200 p-4"><h3 className="font-semibold">CV photo (optional)</h3><p className="mt-1 text-xs text-slate-500">Upload a portrait to Cloudinary. It appears in the CV header; remove it for an application that requests no photo.</p>{value && <img src={value} alt="Your CV portrait" className="mt-3 h-28 w-24 rounded-lg object-cover" />}<label className="mt-3 block text-sm" htmlFor="cv-photo">{loading ? 'Uploading photo…' : 'Upload photo to Cloudinary'}</label><input id="cv-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || loading} onChange={upload} className="mt-2 w-full text-sm" />{value && <button type="button" disabled={disabled || loading} onClick={() => onChange('')} className="mt-3 text-sm text-red-700">Remove photo</button>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</section>;
}
