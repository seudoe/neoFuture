'use client';

import { useEffect, useState } from 'react';

export default function PWATestPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check service worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          setSwRegistration(registration || null);
        });
      }

      // Check for install prompt
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setInstallPrompt(null);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">PWA Test Page</h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">PWA Test Page</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Online Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            {/* Service Worker Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Service Worker</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                swRegistration 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  swRegistration ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                {swRegistration ? 'Registered' : 'Not Registered'}
              </div>
            </div>

            {/* PWA Install Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">PWA Installation</h2>
              {installPrompt ? (
                <button
                  onClick={handleInstall}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Install App
                </button>
              ) : (
                <div className="text-sm text-gray-600">
                  {typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
                    ? 'App is installed and running in standalone mode'
                    : 'Install prompt not available (may already be installed or not supported)'}
                </div>
              )}
            </div>

            {/* PWA Features */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">PWA Features</h2>
              <ul className="text-sm space-y-1">
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  Service Worker Support
                </li>
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></span>
                  Standalone Mode
                </li>
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    typeof window !== 'undefined' && 'caches' in window ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  Cache API Support
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to Test PWA Installation:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open this app in Chrome, Edge, or Safari on mobile/desktop</li>
              <li>Look for an "Install" button in the address bar or browser menu</li>
              <li>Click install to add AgriBridge to your home screen/desktop</li>
              <li>The app will open in standalone mode without browser UI</li>
              <li>Test offline functionality by turning off your internet connection</li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <a 
              href="/" 
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to AgriBridge
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}