'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import toast from 'react-hot-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const parseMarkdown = (text: string) => {
  try {

    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Handle bullet points (• or -)
      if (line.trim().startsWith('•') || line.trim().match(/^[\s]*[-*][\s]/)) {
        const content = line.replace(/^[\s]*[•\-*][\s]*/, '');
        return (
          <div key={lineIndex} className="flex items-start mb-1">
            <span className="text-green-600 mr-2 mt-0.5 flex-shrink-0">•</span>
            <span className="flex-1">{parseBoldText(content)}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      if (/^\s*\d+\./.test(line)) {
        const match = line.match(/^(\s*)(\d+\.)(.*)$/);
        if (match) {
          const [, , number, content] = match;
          return (
            <div key={lineIndex} className="flex items-start mb-1">
              <span className="text-green-600 mr-2 font-medium flex-shrink-0">{number}</span>
              <span className="flex-1">{parseBoldText(content.trim())}</span>
            </div>
          );
        }
      }
      
      // Handle regular lines
      if (line.trim()) {
        return (
          <div key={lineIndex} className="mb-1">
            {parseBoldText(line)}
          </div>
        );
      }
      
      // Empty lines for spacing
      return <div key={lineIndex} className="mb-2"></div>;
    });
  } catch (error) {
    // Fallback to simple text if parsing fails
    console.warn('Markdown parsing failed, falling back to plain text:', error);
    return <div className="whitespace-pre-wrap">{text}</div>;
  }
};

// Helper function to parse bold text within a line
const parseBoldText = (text: string) => {
  try {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        // Remove ** and make bold
        const boldText = part.slice(2, -2);
        return (
          <span key={index} className="font-semibold text-gray-900">
            {boldText}
          </span>
        );
      }
      return part;
    });
  } catch (error) {
    // Fallback to original text if bold parsing fails
    return text;
  }
};

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const { locale } = useI18n();

  // Map locale to speech recognition language
  const speechLang = locale === 'hi' ? 'hi-IN'
    : locale === 'mr' ? 'mr-IN'
    : locale === 'te' ? 'te-IN'
    : 'en-IN';

  const listeningLabel = locale === 'hi' ? 'सुन रहा हूँ... बोलें'
    : locale === 'mr' ? 'ऐकत आहे...'
    : locale === 'te' ? 'వింటున్నాను...'
    : 'Listening... Speak now';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `🌾 Hello! I'm your agricultural advisor. I can help you with:

• Crop cultivation and farming techniques
• Pest control and disease management  
• Soil health and fertilizer recommendations
• Irrigation and water management
• Livestock care and animal husbandry
• Agricultural market information
• Farm equipment and tools

Try asking: "How do I grow tomatoes?" or "What's the best fertilizer for wheat?"

How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize speech recognition - re-create when language changes
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = speechLang;
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        if (event.error === 'network' || event.error === 'no-speech') {
          setIsListening(false);
          return;
        }
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [speechLang]); // re-init when language changes

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          locale,
          conversationHistory: messages.slice(-8).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response) {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No response from chatbot');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your internet connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast.error('Voice recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Chatbot container */}
      <div className={`
        fixed z-50 bg-white shadow-2xl
        lg:bottom-4 lg:right-4 lg:w-96 lg:h-[600px] lg:rounded-2xl
        inset-0 lg:inset-auto
        flex flex-col
      `}>
        {/* Header */}
        <div className="bg-green-600 text-white p-4 lg:rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 mr-3" />
            <div>
              <h3 className="font-semibold">Agricultural Advisor</h3>
              <p className="text-green-100 text-sm">Ask me about farming!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm border'
                }`}
              >
                <div className="text-sm">
                  {message.role === 'assistant' ? parseMarkdown(message.content) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border p-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t lg:rounded-b-2xl">
          {/* Quick action buttons - only show when no messages from user yet */}
          {messages.length === 1 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'How to grow tomatoes?',
                  'Best fertilizer for wheat?',
                  'Pest control for crops?',
                  'Soil testing tips?'
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {/* Voice recognition button */}
            <button
              onClick={toggleVoiceRecognition}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Message input */}
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? 'Listening...' : 'Ask about farming, crops, livestock...'}
              disabled={isLoading || isListening}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Voice recognition status */}
          {isListening && (
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span>{listeningLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}