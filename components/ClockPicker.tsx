'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

interface ClockPickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export default function ClockPicker({ value, onChange, label, required }: ClockPickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [hour, setHour] = useState(value ? parseInt(value.split(':')[0]) : 8);
  const [minute, setMinute] = useState(value ? parseInt(value.split(':')[1]) : 0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(hour >= 12 ? 'PM' : 'AM');
  const clockRef = useRef<HTMLDivElement>(null);
  const canvasSize = 220;
  const center = canvasSize / 2;
  const radius = 80;

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setHour(h);
      setMinute(m);
      setAmpm(h >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (clockRef.current && !clockRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const display12h = (h: number) => {
    const h12 = h % 12 || 12;
    return h12;
  };

  const formatDisplay = () => {
    if (!value) return '--:--';
    const [h, m] = value.split(':').map(Number);
    const h12 = h % 12 || 12;
    const ap = h >= 12 ? 'PM' : 'AM';
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
  };

  const commit = (h: number, m: number) => {
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const handleClockClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    const normalized = ((angle % 360) + 360) % 360;

    if (mode === 'hour') {
      const h12 = Math.round(normalized / 30) % 12 || 12;
      const h24 = ampm === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
      setHour(h24);
      commit(h24, minute);
      setMode('minute');
    } else {
      const m = Math.round(normalized / 6) % 60;
      setMinute(m);
      commit(hour, m);
      setOpen(false);
      setMode('hour');
    }
  };

  const handleAmPm = (ap: 'AM' | 'PM') => {
    setAmpm(ap);
    let h = hour;
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h >= 12) h -= 12;
    setHour(h);
    commit(h, minute);
  };

  const numbers = mode === 'hour'
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 12 }, (_, i) => i * 5);

  const getPos = (index: number, total: number) => {
    const angle = ((index / total) * 360 - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const handAngle = mode === 'hour'
    ? ((display12h(hour) / 12) * 360 - 90) * (Math.PI / 180)
    : ((minute / 60) * 360 - 90) * (Math.PI / 180);

  const handX = center + radius * Math.cos(handAngle);
  const handY = center + radius * Math.sin(handAngle);

  const activeNum = mode === 'hour' ? display12h(hour) : minute;

  return (
    <div className="relative" ref={clockRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}
      <button
        type="button"
        onClick={() => { setOpen(!open); setMode('hour'); }}
        className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white hover:border-green-400 transition-colors"
      >
        <Clock className="w-4 h-4 text-gray-400" />
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? formatDisplay() : 'Select time'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 left-0"
          style={{ minWidth: '260px' }}>
          {/* Header display */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-2xl font-bold">
              <button
                type="button"
                onClick={() => setMode('hour')}
                className={`px-2 py-1 rounded-lg transition-colors ${mode === 'hour' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {String(display12h(hour)).padStart(2, '0')}
              </button>
              <span className="text-gray-400">:</span>
              <button
                type="button"
                onClick={() => setMode('minute')}
                className={`px-2 py-1 rounded-lg transition-colors ${mode === 'minute' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {String(minute).padStart(2, '0')}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => handleAmPm('AM')}
                className={`px-2 py-0.5 text-xs rounded font-medium ${ampm === 'AM' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                AM
              </button>
              <button type="button" onClick={() => handleAmPm('PM')}
                className={`px-2 py-0.5 text-xs rounded font-medium ${ampm === 'PM' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                PM
              </button>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <p className="text-xs text-center text-gray-400 mb-2">
            {mode === 'hour' ? 'Select hour' : 'Select minute'}
          </p>

          {/* Clock face */}
          <svg
            width={canvasSize} height={canvasSize}
            className="cursor-pointer mx-auto block"
            onClick={handleClockClick}
          >
            {/* Clock background */}
            <circle cx={center} cy={center} r={center - 4} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />

            {/* Hand */}
            <line x1={center} y1={center} x2={handX} y2={handY}
              stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
            <circle cx={center} cy={center} r="4" fill="#16a34a" />
            <circle cx={handX} cy={handY} r="10" fill="#16a34a" opacity="0.2" />
            <circle cx={handX} cy={handY} r="6" fill="#16a34a" />

            {/* Numbers */}
            {numbers.map((num, i) => {
              const pos = getPos(i + 1, 12);
              const isActive = num === activeNum;
              return (
                <g key={num}>
                  {isActive && <circle cx={pos.x} cy={pos.y} r="14" fill="#16a34a" />}
                  <text
                    x={pos.x} y={pos.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="13"
                    fontWeight={isActive ? 'bold' : 'normal'}
                    fill={isActive ? 'white' : '#374151'}
                  >
                    {mode === 'minute' ? String(num).padStart(2, '0') : num}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
