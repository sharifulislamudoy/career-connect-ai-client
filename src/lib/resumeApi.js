import { authenticatedFetch } from './aiApi';
export async function resumeRequest(path, options = {}) {
  const response = await authenticatedFetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || data?.message || 'Request failed. Please retry.');
  return data;
}
export const jsonOptions = (method, data) => ({
  method,
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
export async function downloadResume(data) {
  const response = await authenticatedFetch('/api/resumes/generate-pdf', jsonOptions('POST', data));
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || 'PDF export failed.');
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(data.personal?.name || 'Resume').replace(/[^a-z0-9_-]/gi, '_')}_${data.documentType === 'cv' ? 'CV' : 'Resume'}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function emptyResume(user, mode = 'resume') {
  return {
    documentType: mode, template: 'ats', customStyle: {}, photoUrl: '',
    title: '',
    personal: {
      name: user?.displayName || '',
      email: user?.email || '',
      title: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      summary: ''
    },
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    coachEnabled: true
  };
}
export function projectLinks(project = {}) {
  project = project || {};
  return Array.isArray(project.links) ? project.links : [['Live Link', project.liveUrl], ['GitHub Client', project.githubUrl], ['GitHub Server', project.serverUrl]].filter(([, url]) => url).map(([label, url]) => ({ label, url }));
}
export function hydrateResume(resume, user, mode = 'resume') {
  const empty = emptyResume(user);
  return { ...empty, ...resume, documentType: resume.documentType || mode, personal: { ...empty.personal, ...resume.personal }, projects: (resume.projects || []).map(project => ({ ...project, links: projectLinks(project) })) };
}
