'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Loader2, Briefcase, ImageIcon, Camera, X, Calendar, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── types ────────────────────────────────────────────────────────────────────

interface Work {
  id: number;
  title: string;
  description: string;
  media_url: string | null;
  media_urls: string[];
  work_from: string | null;
  work_to: string | null;
  created_at: string;
}

export interface WorkForm {
  title: string;
  description: string;
  work_from: string;
  work_to: string;
  existingUrls: string[];
  newFiles: File[];
  newPreviews: string[];
}

const MAX_PHOTOS = 4;

export const EMPTY_FORM: WorkForm = {
  title: '', description: '', work_from: '', work_to: '',
  existingUrls: [], newFiles: [], newPreviews: [],
};

export function workToForm(w: Work): WorkForm {
  return {
    title: w.title,
    description: w.description ?? '',
    work_from: w.work_from ?? '',
    work_to: w.work_to ?? '',
    existingUrls: w.media_urls?.length ? w.media_urls : w.media_url ? [w.media_url] : [],
    newFiles: [],
    newPreviews: [],
  };
}

// ─── PhotoSection (module-level — never recreated on parent re-render) ────────

interface PhotoSectionProps {
  form: WorkForm;
  onRemoveExisting: (i: number) => void;
  onRemoveNew: (i: number) => void;
  onPickClick: () => void;
  submitting: boolean;
}

function PhotoSection({ form, onRemoveExisting, onRemoveNew, onPickClick, submitting }: PhotoSectionProps) {
  const total = form.existingUrls.length + form.newFiles.length;
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Photos ({total}/{MAX_PHOTOS})
      </label>
      {(form.existingUrls.length > 0 || form.newPreviews.length > 0) && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {form.existingUrls.map((url, i) => (
            <div key={`ex-${i}`} className="relative aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-orange-200" />
              <button type="button" onClick={() => onRemoveExisting(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">saved</span>
            </div>
          ))}
          {form.newPreviews.map((src, i) => (
            <div key={`new-${i}`} className="relative aspect-square">
              <img src={src} alt="" className="w-full h-full object-cover rounded-lg border border-green-300" />
              <button type="button" onClick={() => onRemoveNew(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-green-600/80 text-white text-[10px] px-1 rounded">new</span>
            </div>
          ))}
        </div>
      )}
      {total < MAX_PHOTOS && (
        <button type="button" disabled={submitting} onClick={onPickClick}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-orange-300 rounded-xl text-sm text-orange-700 hover:bg-orange-100 transition-colors w-full justify-center disabled:opacity-50">
          <Camera className="w-4 h-4" />
          {total === 0 ? 'Add Photos' : `Add More (${MAX_PHOTOS - total} left)`}
        </button>
      )}
    </div>
  );
}

// ─── WorkFormFields (module-level) ────────────────────────────────────────────

interface WorkFormFieldsProps {
  form: WorkForm;
  onChange: (f: WorkForm) => void;
  onRemoveExisting: (i: number) => void;
  onRemoveNew: (i: number) => void;
  onPickClick: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onCancel: () => void;
  submitLabel: string;
}

function WorkFormFields({
  form, onChange, onRemoveExisting, onRemoveNew, onPickClick,
  onSubmit, submitting, onCancel, submitLabel,
}: WorkFormFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 bg-orange-50 rounded-xl space-y-4 border border-orange-200">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
        <input
          value={form.title}
          onChange={e => onChange({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
          placeholder="e.g. Installed drip irrigation for 2 acres"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => onChange({ ...form, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
          placeholder="What did you do? What was the result?"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />From
          </label>
          <input type="date" value={form.work_from}
            onChange={e => onChange({ ...form, work_from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />To
          </label>
          <input type="date" value={form.work_to} min={form.work_from || undefined}
            onChange={e => onChange({ ...form, work_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
      </div>
      <PhotoSection
        form={form}
        onRemoveExisting={onRemoveExisting}
        onRemoveNew={onRemoveNew}
        onPickClick={onPickClick}
        submitting={submitting}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
}

// ─── MyWorks ──────────────────────────────────────────────────────────────────

export default function MyWorks({ farmerId }: { farmerId: number }) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<WorkForm>(EMPTY_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<WorkForm>(EMPTY_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const addFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchWorks(); }, [farmerId]);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/farmer-works?farmer_id=${farmerId}`);
      const data = await res.json();
      setWorks(data.works || []);
    } catch { toast.error('Failed to load works'); }
    finally { setLoading(false); }
  };

  // ── file picking ───────────────────────────────────────────────────────────
  const applyFilePick = (e: React.ChangeEvent<HTMLInputElement>, form: WorkForm, setForm: (f: WorkForm) => void) => {
    const files = Array.from(e.target.files || []);
    const total = form.existingUrls.length + form.newFiles.length;
    const remaining = MAX_PHOTOS - total;
    if (remaining <= 0) { toast.error(`Max ${MAX_PHOTOS} photos`); return; }
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) toast.error(`Only ${remaining} more photo${remaining !== 1 ? 's' : ''} allowed`);
    const previews = toAdd.map(f => URL.createObjectURL(f));
    setForm({ ...form, newFiles: [...form.newFiles, ...toAdd], newPreviews: [...form.newPreviews, ...previews] });
    e.target.value = '';
  };

  // ── upload ─────────────────────────────────────────────────────────────────
  const uploadNewFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('farmerId', String(farmerId));
      fd.append('workId', 'temp');
      const res = await fetch('/api/upload-work-photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) urls.push(data.url);
      else toast.error(`Failed to upload ${file.name}`);
    }
    return urls;
  };

  const cleanupPreviews = (form: WorkForm) => form.newPreviews.forEach(p => URL.revokeObjectURL(p));

  // ── add handlers ───────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) { toast.error('Title required'); return; }
    setAddSubmitting(true);
    try {
      const uploaded = await uploadNewFiles(addForm.newFiles);
      const allUrls = [...addForm.existingUrls, ...uploaded];
      const res = await fetch('/api/farmer-works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: farmerId, title: addForm.title, description: addForm.description,
          media_urls: allUrls, media_url: allUrls[0] ?? null,
          work_from: addForm.work_from || null, work_to: addForm.work_to || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Work added!');
      cleanupPreviews(addForm);
      setAddForm(EMPTY_FORM);
      setShowAdd(false);
      fetchWorks();
    } catch { toast.error('Failed to add work'); }
    finally { setAddSubmitting(false); }
  };

  const removeAddExisting = (i: number) => setAddForm(f => ({ ...f, existingUrls: f.existingUrls.filter((_, idx) => idx !== i) }));
  const removeAddNew = (i: number) => {
    URL.revokeObjectURL(addForm.newPreviews[i]);
    setAddForm(f => ({ ...f, newFiles: f.newFiles.filter((_, idx) => idx !== i), newPreviews: f.newPreviews.filter((_, idx) => idx !== i) }));
  };

  // ── edit handlers ──────────────────────────────────────────────────────────
  const startEdit = (work: Work) => {
    if (editingId !== null) cleanupPreviews(editForm);
    setEditForm(workToForm(work));
    setEditingId(work.id);
  };

  const cancelEdit = () => {
    cleanupPreviews(editForm);
    setEditForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) { toast.error('Title required'); return; }
    setEditSubmitting(true);
    try {
      const uploaded = await uploadNewFiles(editForm.newFiles);
      const allUrls = [...editForm.existingUrls, ...uploaded];
      const res = await fetch('/api/farmer-works', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId, title: editForm.title, description: editForm.description,
          media_urls: allUrls, media_url: allUrls[0] ?? null,
          work_from: editForm.work_from || null, work_to: editForm.work_to || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Work updated!');
      cleanupPreviews(editForm);
      setEditForm(EMPTY_FORM);
      setEditingId(null);
      fetchWorks();
    } catch { toast.error('Failed to update work'); }
    finally { setEditSubmitting(false); }
  };

  const removeEditExisting = (i: number) => setEditForm(f => ({ ...f, existingUrls: f.existingUrls.filter((_, idx) => idx !== i) }));
  const removeEditNew = (i: number) => {
    URL.revokeObjectURL(editForm.newPreviews[i]);
    setEditForm(f => ({ ...f, newFiles: f.newFiles.filter((_, idx) => idx !== i), newPreviews: f.newPreviews.filter((_, idx) => idx !== i) }));
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const deleteWork = async (id: number) => {
    if (!confirm('Delete this work entry?')) return;
    try {
      await fetch(`/api/farmer-works?id=${id}`, { method: 'DELETE' });
      setWorks(prev => prev.filter(w => w.id !== id));
      if (editingId === id) cancelEdit();
      toast.success('Work removed');
    } catch { toast.error('Failed to delete'); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">My Recent Work</h3>
        </div>
        <button onClick={() => { setShowAdd(v => !v); if (editingId) cancelEdit(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Work
        </button>
      </div>

      {/* Hidden file inputs — always mounted so refs are stable */}
      <input ref={addFileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => applyFilePick(e, addForm, setAddForm)} />
      <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => applyFilePick(e, editForm, setEditForm)} />

      {/* Add form */}
      {showAdd && (
        <div className="mb-5">
          <WorkFormFields
            form={addForm}
            onChange={setAddForm}
            onRemoveExisting={removeAddExisting}
            onRemoveNew={removeAddNew}
            onPickClick={() => addFileRef.current?.click()}
            onSubmit={handleAdd}
            submitting={addSubmitting}
            onCancel={() => { cleanupPreviews(addForm); setAddForm(EMPTY_FORM); setShowAdd(false); }}
            submitLabel="Save Work"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>
      ) : works.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No work entries yet. Showcase what you've done!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {works.map(work => {
            const isEditing = editingId === work.id;
            const allPhotos = work.media_urls?.length ? work.media_urls : work.media_url ? [work.media_url] : [];
            return (
              <div key={work.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {isEditing ? (
                  <div className="p-3">
                    <WorkFormFields
                      form={editForm}
                      onChange={setEditForm}
                      onRemoveExisting={removeEditExisting}
                      onRemoveNew={removeEditNew}
                      onPickClick={() => editFileRef.current?.click()}
                      onSubmit={handleEdit}
                      submitting={editSubmitting}
                      onCancel={cancelEdit}
                      submitLabel="Save Changes"
                    />
                  </div>
                ) : (
                  <>
                    {allPhotos.length > 0 ? (
                      <div className={`grid gap-0.5 ${
                        allPhotos.length === 1 ? 'grid-cols-1' :
                        allPhotos.length === 2 ? 'grid-cols-2' :
                        allPhotos.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                      }`}>
                        {allPhotos.slice(0, 4).map((url, i) => (
                          <img key={i} src={url} alt=""
                            className={`w-full object-cover ${allPhotos.length === 1 ? 'h-44' : allPhotos.length <= 3 ? 'h-28' : 'h-24'}`}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-orange-50 flex items-center justify-center">
                        <ImageIcon className="w-7 h-7 text-orange-300" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{work.title}</p>
                          {work.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{work.description}</p>}
                          {(work.work_from || work.work_to) && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-orange-700">
                              <Calendar className="w-3 h-3" />
                              {work.work_from && formatDate(work.work_from)}
                              {work.work_from && work.work_to && ' → '}
                              {work.work_to && formatDate(work.work_to)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => startEdit(work)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteWork(work.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
