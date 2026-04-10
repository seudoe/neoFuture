'use client';

import { useState, useEffect } from 'react';
import { Award, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface SkillScheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  link: string;
}

export default function GovtSkillSchemes() {
  const { t } = useI18n();
  const [schemes, setSchemes] = useState<SkillScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/skills/schemes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch schemes');
      }
      
      const data = await response.json();
      setSchemes(data.schemes || []);
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('Failed to load schemes');
    } finally {
      setLoading(false);
    }
  };

  const handleSchemeClick = (link: string, name: string) => {
    console.log(`Opening scheme: ${name}`);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center mb-6">
        <Award className="w-6 h-6 text-green-600 mr-3" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t('skillDevelopment.schemes.title')}</h3>
          <p className="text-sm text-gray-600">{t('skillDevelopment.schemes.subtitle')}</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
          <span className="text-gray-600">{t('skillDevelopment.schemes.loading')}</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button
            onClick={fetchSchemes}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            {t('common.refresh')}
          </button>
        </div>
      )}

      {!loading && !error && schemes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {schemes.map((scheme, index) => (
            <div
              key={scheme.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white"
            >
              <div className="flex items-start mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white text-sm font-bold rounded-full mr-3 shrink-0">
                  {index + 1}
                </span>
                <h4 className="text-lg font-semibold text-gray-900 leading-tight">{scheme.name}</h4>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-4">{scheme.description}</p>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-1">
                      {t('skillDevelopment.schemes.eligibility')}:
                    </p>
                    <p className="text-sm text-blue-800">{scheme.eligibility}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSchemeClick(scheme.link, scheme.name)}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group"
              >
                <span className="font-medium">{t('skillDevelopment.schemes.register')}</span>
                <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && schemes.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('skillDevelopment.schemes.noSchemes')}</h3>
        </div>
      )}
    </div>
  );
}
