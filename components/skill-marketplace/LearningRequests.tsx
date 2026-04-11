'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Loader2, CheckCircle, XCircle, Clock, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface Request {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  skill: { skill_name: string; category: string };
  teacher?: { id: number; name: string; phone_number: string };
  learner?: { id: number; name: string; phone_number: string };
}

const statusBadge = (s: string) => {
  if (s === 'accepted') return 'bg-green-100 text-green-700';
  if (s === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

const statusIcon = (s: string) => {
  if (s === 'accepted') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (s === 'rejected') return <XCircle className="w-4 h-4 text-red-600" />;
  return <Clock className="w-4 h-4 text-yellow-600" />;
};

export default function LearningRequests({ farmerId }: { farmerId: number }) {
  const [tab, setTab] = useState<'sent' | 'received'>('received');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRequests(); }, [tab, farmerId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const param = tab === 'sent' ? `learner_id=${farmerId}` : `teacher_id=${farmerId}`;
      const res = await fetch(`/api/skill-requests?${param}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch('/api/skill-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) { toast.error('Failed to update'); return; }
      toast.success(`Request ${status}`);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Learning Requests</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {(['received', 'sent'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t === 'received' ? 'Received' : 'Sent'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No {tab} requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const person = tab === 'received' ? req.learner : req.teacher;
            return (
              <div key={req.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {tab === 'received' ? 'From' : 'To'}: {person?.name}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(req.status)}`}>
                        {statusIcon(req.status)} {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Skill: <span className="font-medium text-blue-700">{req.skill?.skill_name}</span>
                      <span className="text-gray-400 ml-1">({req.skill?.category})</span>
                    </p>
                    {req.message && <p className="text-xs text-gray-500 mt-1 italic">"{req.message}"</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {person?.phone_number && (
                      <a href={`tel:${person.phone_number}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100">
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                    {tab === 'received' && req.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => updateStatus(req.id, 'accepted')}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                          Accept
                        </button>
                        <button onClick={() => updateStatus(req.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
