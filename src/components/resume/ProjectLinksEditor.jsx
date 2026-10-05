export default function ProjectLinksEditor({ links = [], onChange, disabled, projectIndex }) {
  const update = (index, key, value) => onChange(links.map((link, i) => i === index ? { ...link, [key]: value } : link));
  return <section className="mt-5 border-t border-slate-200 pt-4">
    <h4 className="text-sm font-semibold">Project links</h4><p className="mb-3 mt-1 text-xs text-slate-500">Clickable labels on one PDF row, separated by a dash. Use short names such as Live Link, GitHub Client, GitHub API, Docs or Demo. The exporter asks you to shorten labels if they cannot fit.</p>
    <div className="space-y-3">{links.map((link, index) => <div key={index} className="grid items-end gap-2 sm:grid-cols-[1fr_2fr_auto]">
      <div><label htmlFor={`link-${projectIndex}-${index}-label`} className="text-xs font-medium">Link label</label><input id={`link-${projectIndex}-${index}-label`} disabled={disabled} maxLength={40} value={link.label} onChange={e => update(index, 'label', e.target.value)} placeholder="GitHub API" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
      <div><label htmlFor={`link-${projectIndex}-${index}-url`} className="text-xs font-medium">URL</label><input id={`link-${projectIndex}-${index}-url`} disabled={disabled} type="url" maxLength={3000} value={link.url} onChange={e => update(index, 'url', e.target.value)} placeholder="https://github.com/…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
      <button type="button" disabled={disabled} aria-label={`Remove project ${projectIndex + 1} link ${index + 1}`} onClick={() => onChange(links.filter((_, i) => i !== index))} className="py-2 text-sm text-red-700">Remove</button>
    </div>)}</div>
    <button type="button" disabled={disabled || links.length >= 12} onClick={() => onChange([...links, { label: '', url: '' }])} className="mt-3 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 disabled:opacity-40">+ Add link</button>
  </section>;
}
