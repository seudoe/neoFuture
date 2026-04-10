'use client';

import { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Loader2, AlertCircle, Phone, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface TrainingCenter {
  id: string;
  name: string;
  type: 'KVK' | 'RSETI';
  location: string;
  state: string;
  district: string;
  contact?: string;
  mapUrl: string;
  website?: string;
}

export default function TrainingCenters() {
  const { t } = useI18n();
  const [centers, setCenters] = useState<TrainingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'KVK' | 'RSETI'>('ALL');

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/skills/training-centers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch training centers');
      }
      
      const data = await response.json();
      setCenters(data.centers || []);
    } catch (err) {
      console.error('Error fetching training centers:', err);
      setError('Failed to load training centers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = filterType === 'ALL' 
    ? centers 
    : centers.filter(center => center.type === filterType);

  const handleDirections = (mapUrl: string, name: string) => {
    console.log(`Opening directions for: ${name}`);
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MapPin className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{t('skillDevelopment.trainingCenters.title')}</h3>
            <p className="text-sm text-gray-600">{t('skillDevelopment.trainingCenters.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterType === 'ALL'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Centers
        </button>
        <button
          onClick={() => setFilterType('KVK')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterType === 'KVK'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('skillDevelopment.trainingCenters.kvk')}
        </button>
        <button
          onClick={() => setFilterType('RSETI')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterType === 'RSETI'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('skillDevelopment.trainingCenters.rseti')}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
          <span className="text-gray-600">{t('common.loading')}</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button
            onClick={fetchCenters}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            {t('common.refresh')}
          </button>
        </div>
      )}

      {!loading && !error && filteredCenters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCenters.map((center) => (
            <div
              key={center.id}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex-1">{center.name}</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  center.type === 'KVK' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {center.type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-gray-400" />
                  <span>{center.location}</span>
                </div>
                {center.contact && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 shrink-0 text-gray-400" />
                    <span>{center.contact}</span>
                  </div>
                )}
                {center.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-2 shrink-0 text-gray-400" />
                    <a 
                      href={center.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDirections(center.mapUrl, center.name)}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group"
              >
                <MapPin className="w-4 h-4 mr-2" />
                <span>{t('skillDevelopment.trainingCenters.getDirections')}</span>
                <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredCenters.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('skillDevelopment.trainingCenters.noCenters')}</h3>
        </div>
      )}
    </div>
  );
}
