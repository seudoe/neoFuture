'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Plus, X, Users, MapPin, Calendar, Clock, Wrench, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import ClockPicker from '@/components/ClockPicker';

interface Job {
  id: number;
  lister_id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  workers_required: number;
  workers_accepted: number;
  fixed_pay: number;
  tools_required: string;
  tools_provided: boolean;
  registration_deadline: string;
  status: 'open' | 'in_work' | 'closed';
  users?: { name: string; phone_number: string };
  job_applications?: JobApplication[];
}

interface JobApplication {
  id: number;
  job_id: number;
  worker_id: number;
  status: 'applied' | 'accepted' | 'rejected' | 'working' | 'completed';
  payment_status: 'pending' | 'paid';
  users?: { name: string; phone_number: string };
}

const emptyForm = {
  title: '', description: '', location: '',
  start_date: '', end_date: '', start_time: '', end_time: '',
  workers_required: '1', fixed_pay: '', tools_required: '',
  tools_provided: false, registration_deadline: ''
};

export default function JobsPage() {
  const { user } = useDashboardData('seller');
  const [browseJobs, setBrowseJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-jobs' | 'my-applications'>('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchMyJobsById(user.id);
      fetchMyApplicationsById(user.id);
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs?status=open');
      const data = await res.json();
      setBrowseJobs(data.jobs || []);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const fetchMyApplicationsById = async (userId: number) => {
    try {
      const res = await fetch(`/api/jobs?worker_id=${userId}`);
      const data = await res.json();
      setMyApplications(data.applications || []);
    } catch {}
  };

  const fetchMyApplications = async () => {
    if (!user) return;
    fetchMyApplicationsById(user.id);
  };

  const fetchMyJobsById = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?lister_id=${userId}`);
      const data = await res.json();
      setMyJobs(data.jobs || []);
    } catch { toast.error('Failed to load your jobs'); }
    finally { setLoading(false); }
  };

  const fetchMyJobs = async () => {
    if (!user) return;
    fetchMyJobsById(user.id);
  };

  const handleTabChange = (tab: 'browse' | 'my-jobs' | 'my-applications') => {
    setActiveTab(tab);
    setExpandedJob(null);
    if (tab === 'browse') fetchJobs();
    else if (tab === 'my-jobs') fetchMyJobs();
    else fetchMyApplications();
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lister_id: user.id,
          workers_required: parseInt(form.workers_required),
          fixed_pay: parseFloat(form.fixed_pay),
          registration_deadline: form.registration_deadline
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Job posted successfully!');
        setShowCreateForm(false);
        setForm(emptyForm);
        await fetchMyJobsById(user.id);
        setActiveTab('my-jobs');
      } else {
        toast.error(data.error || 'Failed to create job');
      }
    } catch { toast.error('Error creating job'); }
    finally { setSubmitting(false); }
  };

  const handleApply = async (jobId: number) => {
    if (!user) return;
    try {
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, worker_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Applied successfully!');
        fetchJobs();
        fetchMyApplications();
      } else {
        toast.error(data.error || 'Failed to apply');
      }
    } catch { toast.error('Error applying'); }
  };

  const handleApplicationAction = async (applicationId: number, jobId: number, action: 'accept' | 'reject') => {
    if (!user) return;
    try {
      const res = await fetch('/api/job-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, job_id: jobId, lister_id: user.id, action })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Worker ${action}ed!`);
        fetchMyJobs();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch { toast.error('Error'); }
  };

  const handleJobAction = async (jobId: number, action: 'start' | 'end') => {
    if (!user) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, lister_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(action === 'start' ? 'Job started!' : 'Job completed & workers paid!');
        fetchMyJobs();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch { toast.error('Error'); }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!user) return;
    if (!window.confirm('Remove this job listing? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lister_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Job removed.');
        fetchMyJobsById(user.id);
      } else {
        toast.error(data.error || 'Failed to remove job');
      }
    } catch { toast.error('Error removing job'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      in_work: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-700',
      applied: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      working: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const hasApplied = (jobId: number) =>
    myApplications.some((a: any) => a.job_id === jobId);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Group jobs by start_date
  const groupByDate = (jobList: Job[]) => {
    const groups: Record<string, Job[]> = {};
    jobList.forEach(job => {
      const key = job.start_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(job);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Briefcase className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Farm Jobs</h2>
              <p className="text-gray-500 text-sm mt-1">Post jobs or find farm work nearby</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post a Job
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          {(['browse', 'my-jobs', 'my-applications'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'browse' ? 'Browse Jobs' : tab === 'my-jobs' ? 'My Posted Jobs' : 'My Applications'}
            </button>
          ))}
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Post a Farm Job</h3>
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g., Wheat Harvesting Workers" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                  placeholder="Describe the work..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input type="text" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Village, District, State" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" required value={form.start_date} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" required value={form.end_date} min={form.start_date || new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <ClockPicker
                    label="Start Time"
                    required
                    value={form.start_time}
                    onChange={v => setForm({ ...form, start_time: v })}
                  />
                </div>
                <div>
                  <ClockPicker
                    label="End Time"
                    required
                    value={form.end_time}
                    onChange={v => setForm({ ...form, end_time: v })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workers Needed *</label>
                  <input type="number" min="1" required value={form.workers_required}
                    onChange={e => setForm({ ...form, workers_required: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Pay (₹) *</label>
                  <input type="number" min="1" step="0.01" required value={form.fixed_pay}
                    onChange={e => setForm({ ...form, fixed_pay: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline *</label>
                <input type="date" required value={form.registration_deadline}
                  min={new Date().toISOString().split('T')[0]}
                  max={form.start_date || undefined}
                  onChange={e => setForm({ ...form, registration_deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tools Required</label>
                <input type="text" value={form.tools_required} onChange={e => setForm({ ...form, tools_required: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g., Sickle, Gloves" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.tools_provided} onChange={e => setForm({ ...form, tools_provided: e.target.checked })}
                  className="rounded border-gray-300 text-green-600" />
                <span className="text-sm text-gray-700">Tools will be provided by me</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">Loading jobs...</div>
      ) : (
        <div className="space-y-4">
          {/* Browse Jobs */}
          {activeTab === 'browse' && (
            browseJobs.filter(job => !hasApplied(job.id)).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No open jobs right now. Check back later!</p>
              </div>
            ) : browseJobs.filter(job => !hasApplied(job.id)).map(job => (
              <div key={job.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <span className={statusBadge(job.status)}>{job.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(job.start_date)} – {formatDate(job.end_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.start_time} – {job.end_time}</span>
                      <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />₹{job.fixed_pay}/day</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.workers_accepted}/{job.workers_required} workers
                        {job.workers_accepted >= job.workers_required && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Full</span>}
                      </span>
                    </div>
                    {job.description && <p className="text-sm text-gray-600 mt-2">{job.description}</p>}
                    {job.tools_required && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" />
                        Tools: {job.tools_required} {job.tools_provided ? '(provided)' : '(bring your own)'}
                      </p>
                    )}
                    <p className="text-xs text-orange-600 mt-1">Apply by: {formatDate(job.registration_deadline)}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    {job.lister_id === user?.id ? (
                      <span className="text-xs text-gray-400">Your job</span>
                    ) : hasApplied(job.id) ? (
                      <span className="text-xs text-green-600 font-medium">Applied ✓</span>
                    ) : job.workers_accepted >= job.workers_required ? (
                      <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg">Full</span>
                    ) : (
                      <button onClick={() => handleApply(job.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* My Posted Jobs */}
          {activeTab === 'my-jobs' && (
            myJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven't posted any jobs yet.</p>
                <button onClick={() => setShowCreateForm(true)}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                  Post Your First Job
                </button>
              </div>
            ) : groupByDate(myJobs).map(([date, dateJobs]) => (
              <div key={date}>
                {/* Date strip */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(date)}
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{dateJobs.length} job{dateJobs.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3 mb-6">
                  {dateJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-2xl shadow-sm p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <span className={statusBadge(job.status)}>{job.status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.start_time} – {job.end_time}</span>
                            <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />₹{job.fixed_pay}/day</span>
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.workers_accepted}/{job.workers_required} accepted</span>
                          </div>
                          {job.description && <p className="text-sm text-gray-500 mt-1">{job.description}</p>}
                          <p className="text-xs text-orange-500 mt-1">Deadline: {formatDate(job.registration_deadline)}</p>
                        </div>
                        <div className="flex gap-2 ml-4 flex-wrap justify-end">
                          {job.status === 'open' && job.workers_accepted > 0 && (
                            <button onClick={() => handleJobAction(job.id, 'start')}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                              Start Job
                            </button>
                          )}
                          {job.status === 'in_work' && (
                            <button onClick={() => handleJobAction(job.id, 'end')}
                              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                              End & Pay
                            </button>
                          )}
                          <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1">
                            Applications {expandedJob === job.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDeleteJob(job.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200">
                            Remove
                          </button>
                        </div>
                      </div>

                      {expandedJob === job.id && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Applications ({job.job_applications?.length || 0})
                          </h4>
                          {!job.job_applications?.length ? (
                            <p className="text-sm text-gray-500">No applications yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {job.job_applications.map(app => (
                                <div key={app.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">Worker #{app.worker_id}</span>
                                    <span className={`ml-2 ${statusBadge(app.status)}`}>{app.status}</span>
                                    {app.payment_status === 'paid' && (
                                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Paid</span>
                                    )}
                                  </div>
                                  {app.status === 'applied' && (
                                    <div className="flex gap-2">
                                      <button onClick={() => handleApplicationAction(app.id, job.id, 'accept')}
                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                                        Accept
                                      </button>
                                      <button onClick={() => handleApplicationAction(app.id, job.id, 'reject')}
                                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* My Applications */}
          {activeTab === 'my-applications' && (
            myApplications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven't applied to any jobs yet.</p>
              </div>
            ) : myApplications.map((app: any) => (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{app.jobs?.title}</h3>
                      <span className={statusBadge(app.status)}>{app.status}</span>
                      {app.payment_status === 'paid' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Paid</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{app.jobs?.location}</span>
                      <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />₹{app.jobs?.fixed_pay}/day</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{app.jobs?.start_date && formatDate(app.jobs.start_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
