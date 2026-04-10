'use client';

import { useState, useEffect } from 'react';
import { Award, ExternalLink, RefreshCw, AlertCircle, Loader2, Calendar } from 'lucide-react';

interface GovernmentScheme {
  title: string;
  description: string;
  link: string;
}

interface SchemesData {
  schemes: GovernmentScheme[];
  lastUpdated: string;
  note?: string;
}

export default function SubsidiesPrograms() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/schemes');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SchemesData = await response.json();
      
      setSchemes(data.schemes || []);
      setLastUpdated(data.lastUpdated || '');
      setNote(data.note || '');
      
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('Failed to load government schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const handleLinkClick = (link: string, title: string) => {
    // Track click for analytics if needed
    console.log(`Opening scheme: ${title}`);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Award className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subsidies & Programs</h2>
            <p className="text-gray-600 text-sm mt-1">Latest government schemes for farmers</p>
          </div>
        </div>
        
        <button
          onClick={fetchSchemes}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh schemes"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Last updated info */}
      {lastUpdated && (
        <div className="flex items-center text-sm text-gray-700 mb-4">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Last updated: {formatDate(lastUpdated)}</span>
          {note && (
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
              {note}
            </span>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
          <span className="text-gray-600">Loading government schemes...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error Loading Schemes</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchSchemes}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Schemes grid */}
      {!loading && !error && schemes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map((scheme, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-linear-to-br from-green-50 to-white hover:from-green-100 hover:to-green-50 flex flex-col"
            >
              {/* Scheme header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full mr-3">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                      {scheme.title}
                    </h3>
                  </div>
                  <div className="flex items-center text-sm text-green-600 mb-3">
                    <Award className="w-4 h-4 mr-1" />
                    <span>Government Scheme</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm leading-relaxed mb-4 grow">
                {scheme.description}
              </p>

              {/* Action button */}
              <button
                onClick={() => handleLinkClick(scheme.link, scheme.title)}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group mt-auto"
              >
                <span className="font-medium">Learn More & Apply</span>
                <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && schemes.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Schemes Available</h3>
          <p className="text-gray-700 mb-4">Unable to load government schemes at the moment.</p>
          <button
            onClick={fetchSchemes}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}