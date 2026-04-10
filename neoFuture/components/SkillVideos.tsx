'use client';

import { useState } from 'react';
import { Search, Play, Mic, MicOff, ExternalLink, Loader2, Sprout, AlertCircle, KeyRound } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  url: string;
  publishedAt?: string;
}

type SearchState = 'idle' | 'loading' | 'done' | 'filtered' | 'error' | 'no_key' | 'quota';

export default function SkillVideos() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setState('loading');
    setVideos([]);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/skills/videos?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (res.status === 503) { setState('no_key'); return; }
      if (res.status === 429) { setState('quota'); return; }
      if (!res.ok) { setErrorMsg(data.error || 'Something went wrong.'); setState('error'); return; }
      if (data.filtered) { setState('filtered'); return; }

      setVideos(data.videos || []);
      setState('done');
    } catch {
      setErrorMsg('Network error. Please check your connection.');
      setState('error');
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser');
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => { setSearchQuery(e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Play className="w-6 h-6 text-green-600 mr-3" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t('skillDevelopment.videos.title')}</h3>
          <p className="text-sm text-gray-600">{t('skillDevelopment.videos.subtitle')}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('skillDevelopment.videos.searchPlaceholder')}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleVoiceSearch}
            disabled={isListening}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
            title={t('skillDevelopment.videos.voiceSearch')}
          >
            {isListening
              ? <MicOff className="w-5 h-5 text-red-500 animate-pulse" />
              : <Mic className="w-5 h-5" />}
          </button>
        </div>
        <button
          onClick={handleSearch}
          disabled={state === 'loading' || !searchQuery.trim()}
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {state === 'loading'
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Search className="w-5 h-5" />}
          <span className="hidden sm:inline">
            {state === 'loading' ? t('common.loading') : t('skillDevelopment.videos.search')}
          </span>
        </button>
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
          <span className="text-gray-600">Fetching videos from YouTube...</span>
        </div>
      )}

      {/* No API key */}
      {state === 'no_key' && (
        <div className="flex flex-col items-center py-12 text-center">
          <KeyRound className="w-14 h-14 text-orange-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">YouTube API Key Required</h3>
          <p className="text-gray-500 text-sm max-w-md">
            Add your <span className="font-mono bg-gray-100 px-1 rounded">YOUTUBE_API_KEY</span> to{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">.env.local</span> to enable video search.
            Get a free key at{' '}
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              console.cloud.google.com
            </a>{' '}
            → Enable YouTube Data API v3.
          </p>
        </div>
      )}

      {/* Quota exceeded */}
      {state === 'quota' && (
        <div className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="w-14 h-14 text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Daily Quota Reached</h3>
          <p className="text-gray-500 text-sm">YouTube API daily quota has been exceeded. Please try again tomorrow.</p>
        </div>
      )}

      {/* Generic error */}
      {state === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Non-agriculture topic */}
      {state === 'filtered' && (
        <div className="text-center py-12">
          <Sprout className="w-16 h-16 text-green-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Only farming topics allowed</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Try searching for{' '}
            <span className="text-green-700 font-medium">drip irrigation</span>,{' '}
            <span className="text-green-700 font-medium">organic farming</span>,{' '}
            <span className="text-green-700 font-medium">pest control</span>,{' '}
            <span className="text-green-700 font-medium">soil health</span>, or{' '}
            <span className="text-green-700 font-medium">crop management</span>.
          </p>
        </div>
      )}

      {/* No results */}
      {state === 'done' && videos.length === 0 && (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('skillDevelopment.videos.noVideos')}</h3>
          <p className="text-gray-500 text-sm">{t('skillDevelopment.videos.tryDifferentSearch')}</p>
        </div>
      )}

      {/* Results */}
      {state === 'done' && videos.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">{videos.length} videos found for "<span className="font-medium text-gray-700">{searchQuery}</span>"</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-green-300"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
                    }}
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                  </div>
                  {/* YouTube badge */}
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> YouTube
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-green-700 transition-colors">
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">{video.channel}</p>
                    {video.publishedAt && (
                      <p className="text-xs text-gray-400 shrink-0 ml-2">{formatDate(video.publishedAt)}</p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* Idle state */}
      {state === 'idle' && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-sm">
            Search for farming topics like{' '}
            <button onClick={() => { setSearchQuery('drip irrigation'); }} className="text-green-600 font-medium hover:underline">drip irrigation</button>,{' '}
            <button onClick={() => { setSearchQuery('organic farming'); }} className="text-green-600 font-medium hover:underline">organic farming</button>,{' '}
            <button onClick={() => { setSearchQuery('pest control'); }} className="text-green-600 font-medium hover:underline">pest control</button>
          </p>
        </div>
      )}
    </div>
  );
}


