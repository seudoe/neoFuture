'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import Chatbot from './Chatbot';

export default function ChatbotButton() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Hide pulse after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating chatbot button */}
      {!isChatbotOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              setIsChatbotOpen(true);
              setShowPulse(false);
            }}
            className={`bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 ${
              showPulse ? 'animate-pulse' : ''
            }`}
            title="Open Agricultural Advisor"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          
          {/* Notification badge */}
          {showPulse && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">!</span>
            </div>
          )}
        </div>
      )}

      {/* Chatbot overlay */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </>
  );
}