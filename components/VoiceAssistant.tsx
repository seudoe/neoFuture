'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, X } from 'lucide-react';
import { useVoiceRecognition } from '@/lib/hooks/useVoiceRecognition';
import { parseVoiceCommand, speak } from '@/lib/utils/voiceCommands';
import toast from 'react-hot-toast';

interface VoiceAssistantProps {
  role: 'buyer' | 'farmer';
}

type Status = 'idle' | 'listening' | 'success' | 'error';

export default function VoiceAssistant({ role }: VoiceAssistantProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const color = role === 'farmer' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';
  const ringColor = role === 'farmer' ? 'ring-green-400' : 'ring-blue-400';

  const { isListening, isSupported, toggle } = useVoiceRecognition({
    onResult: (text) => {
      setTranscript(text);
      const match = parseVoiceCommand(text, role);

      if (match) {
        setStatus('success');
        speak(`Going to ${match.label}`);
        toast.success(`Going to ${match.label}`, { icon: '🎤' });
        setTimeout(() => {
          router.push(match.route);
          setStatus('idle');
          setTranscript('');
        }, 800);
      } else {
        setStatus('error');
        speak('Command not recognized. Try saying dashboard, orders, or profile.');
        toast.error(`"${text}" — not recognized`, { icon: '🎤' });
        setTimeout(() => {
          setStatus('idle');
          setTranscript('');
        }, 2500);
      }
    },
    onError: (err) => {
      setStatus('error');
      toast.error(err);
      setTimeout(() => setStatus('idle'), 2000);
    },
  });

  // Sync listening state
  useEffect(() => {
    if (isListening) setStatus('listening');
  }, [isListening]);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      {/* Transcript bubble */}
      {transcript && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2 text-sm text-gray-700 max-w-[200px] text-center animate-fade-in">
          "{transcript}"
        </div>
      )}

      {/* Status label */}
      {status === 'listening' && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow px-3 py-1.5 text-sm text-gray-700">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Listening...
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && status === 'idle' && (
        <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 max-w-[180px] text-center">
          Say: "Go to orders", "Open cart", "Show profile"...
        </div>
      )}

      {/* Main mic button */}
      <button
        onClick={toggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-14 h-14 rounded-full text-white shadow-lg transition-all duration-200 flex items-center justify-center
          ${color}
          ${isListening ? `ring-4 ${ringColor} scale-110` : 'scale-100'}
          ${status === 'error' ? 'bg-red-500 hover:bg-red-600' : ''}
          ${status === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
        `}
        aria-label={isListening ? 'Stop voice navigation' : 'Start voice navigation'}
        title="Voice Navigation"
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
