'use client';

import { useState, useEffect } from 'react';
import { Phone, MapPin, GraduationCap, Loader2, Users, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface FarmerSkill {
  id: number;
  skill_name: string;
  category: string;
  is_teaching: boolean;
  experience_years: number;
}

interface FarmerWork {
  id: number;
  title: string;
  description: string;
  media_url: string;
}

interface Farmer {
  id: number;
  name: string;
  phone_number: string;
  farmer_skills: FarmerSkill[];
  farmer_works: FarmerWork[];
}

export default function ExploreFarmers({ currentFarmerId }: { currentFarmerId: number }) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [applyModal, setApplyModal] = useState<{ skill: FarmerSkill; teacher: Farmer } | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchFarmers(1); }, []);

  const fetchFarmers = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/farmer-skills?feed=true&page=${p}`);
      const data = await res.json();
      const list: Farmer[] = (data.farmers || []).filter((f: Farmer) => f.id !== currentFarmerId);
      if (p === 1) setFarmers(list);
      else setFarmers(prev => [...prev, ...list]);
      setHasMore(list.length === 12);
      setPage(p);
    } catch { toast.error('Failed to load farmers'); }
    finally { setLoading(false); }
  };

  const handleApply = async () => {
    if (!applyModal) return;
    setApplying(applyModal.skill.id);
    try {
      const res = await fetch('/api/skill-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learner_id: currentFarmerId,
          teacher_id: applyModal.teacher.id,
          skill_id: applyModal.skill.id,
          message
        })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Learning request sent!');
      setApplyModal(null);
      setMessage('');
    } catch { toast.error('Failed to send request'); }
    finally { setApplying(null); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Explore Farmers</h3>
        <span className="text-sm text-gray-500">— learn from peers</span>
      </div>

      {loading && farmers.length === 0 ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-purple-600" /></div>
      ) : farmers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No farmers with skills yet. Be the first to add yours!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farmers.map(farmer => (
              <div key={farmer.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{farmer.name}</p>
                    {farmer.phone_number && (
                      <a href={`tel:${farmer.phone_number}`}
                        className="flex items-center gap-1 text-xs text-green-700 hover:underline mt-0.5">
                        <Phone className="w-3 h-3" />{farmer.phone_number}
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{farmer.farmer_skills.length} skill{farmer.farmer_skills.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {farmer.farmer_skills.slice(0, 4).map(skill => (
                    <span key={skill.id}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        skill.is_teaching
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                      {skill.skill_name}
                      {skill.is_teaching && ' 🎓'}
                    </span>
                  ))}
                  {farmer.farmer_skills.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                      +{farmer.farmer_skills.length - 4} more
                    </span>
                  )}
                </div>

                {/* Recent work preview */}
                {farmer.farmer_works.length > 0 && (
                  <div className="mb-3 p-2.5 bg-orange-50 rounded-lg">
                    <p className="text-xs font-medium text-orange-800 mb-0.5">Recent Work</p>
                    <p className="text-xs text-orange-700 truncate">{farmer.farmer_works[0].title}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {farmer.phone_number && (
                    <a href={`tel:${farmer.phone_number}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  )}

                  {/* Apply to learn teachable skills */}
                  {farmer.farmer_skills.filter(s => s.is_teaching).map(skill => (
                    <button key={skill.id}
                      onClick={() => { setApplyModal({ skill, teacher: farmer }); setMessage(''); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition-colors">
                      <GraduationCap className="w-3.5 h-3.5" /> Learn {skill.skill_name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-5">
              <button onClick={() => fetchFarmers(page + 1)} disabled={loading}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {/* Apply modal */}
      {applyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Apply to Learn</h4>
            <p className="text-sm text-gray-600 mb-4">
              Request <span className="font-medium">{applyModal.teacher.name}</span> to teach you{' '}
              <span className="font-medium text-blue-700">{applyModal.skill.skill_name}</span>
            </p>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={3} placeholder="Introduce yourself and explain why you want to learn this skill..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={handleApply} disabled={!!applying}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50">
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                Send Request
              </button>
              <button onClick={() => setApplyModal(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
