'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Irrigation', 'Organic Farming', 'Pest Control', 'Soil Health',
  'Machinery', 'Horticulture', 'Dairy & Livestock', 'Post-Harvest',
  'Crop Management', 'Other'
];

interface Skill {
  id: number;
  skill_name: string;
  description: string;
  category: string;
  is_teaching: boolean;
  experience_years: number;
}

export default function MySkills({ farmerId }: { farmerId: number }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    skill_name: '', description: '', category: CATEGORIES[0],
    is_teaching: false, experience_years: 1
  });

  useEffect(() => { fetchSkills(); }, [farmerId]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/farmer-skills?farmer_id=${farmerId}`);
      const data = await res.json();
      setSkills(data.skills || []);
    } catch { toast.error('Failed to load skills'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.skill_name.trim()) { toast.error('Skill name required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/farmer-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: farmerId, ...form })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Skill added!');
      setShowForm(false);
      setForm({ skill_name: '', description: '', category: CATEGORIES[0], is_teaching: false, experience_years: 1 });
      fetchSkills();
    } catch { toast.error('Failed to add skill'); }
    finally { setSubmitting(false); }
  };

  const toggleTeaching = async (skill: Skill) => {
    try {
      await fetch('/api/farmer-skills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: skill.id, is_teaching: !skill.is_teaching })
      });
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_teaching: !s.is_teaching } : s));
    } catch { toast.error('Failed to update'); }
  };

  const deleteSkill = async (id: number) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await fetch(`/api/farmer-skills?id=${id}`, { method: 'DELETE' });
      setSkills(prev => prev.filter(s => s.id !== id));
      toast.success('Skill removed');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">My Skills</h3>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Skill
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-5 p-4 bg-green-50 rounded-xl space-y-3 border border-green-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Skill Name *</label>
              <input value={form.skill_name} onChange={e => setForm({ ...form, skill_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. Drip Irrigation Setup" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder="Briefly describe your expertise..." />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Years of Experience</label>
              <input type="number" min={0} max={50} value={form.experience_years}
                onChange={e => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" checked={form.is_teaching}
                onChange={e => setForm({ ...form, is_teaching: e.target.checked })}
                className="rounded border-gray-300 text-green-600" />
              <span className="text-sm text-gray-700">Willing to teach others</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Skill
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
      ) : skills.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No skills added yet. Add your first skill!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map(skill => (
            <div key={skill.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-xl hover:border-green-200 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{skill.skill_name}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{skill.category}</span>
                  {skill.is_teaching && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Teaching</span>
                  )}
                </div>
                {skill.description && <p className="text-sm text-gray-600 mt-1 truncate">{skill.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{skill.experience_years} yr{skill.experience_years !== 1 ? 's' : ''} experience</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <button onClick={() => toggleTeaching(skill)} title={skill.is_teaching ? 'Stop teaching' : 'Offer to teach'}
                  className="text-gray-400 hover:text-blue-600 transition-colors">
                  {skill.is_teaching
                    ? <ToggleRight className="w-6 h-6 text-blue-600" />
                    : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={() => deleteSkill(skill.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
