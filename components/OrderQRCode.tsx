'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface OrderQRCodeProps {
  trackingCode: string;
  orderId: number;
  size?: number;
}

export default function OrderQRCode({ trackingCode, orderId, size = 200 }: OrderQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showIpWarning, setShowIpWarning] = useState(false);
  
  // Get the base URL - use window.location.origin for automatic detection
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingUrl = `${baseUrl}/track/${trackingCode}`;
  
  // Check if running on localhost
  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  
  // Get local IP hint (this is just for display, actual IP needs to be set manually or via env)
  const getLocalIpHint = () => {
    // In production or when deployed, this won't be an issue
    if (!isLocalhost) return null;
    
    // Show warning about localhost
    return (
      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-xs text-orange-800 font-medium mb-1">
          ⚠️ Scanning from Phone?
        </p>
        <p className="text-xs text-orange-700">
          This QR code uses <code className="bg-orange-100 px-1 rounded">localhost</code> which only works on this computer.
        </p>
        <p className="text-xs text-orange-700 mt-2">
          <strong>To scan from phone:</strong>
        </p>
        <ol className="text-xs text-orange-700 mt-1 ml-4 list-decimal">
          <li>Connect phone to same WiFi</li>
          <li>Find your computer's IP address</li>
          <li>Replace <code className="bg-orange-100 px-1 rounded">localhost</code> with your IP</li>
        </ol>
        <button
          onClick={() => setShowIpWarning(!showIpWarning)}
          className="text-xs text-orange-600 underline mt-2"
        >
          {showIpWarning ? 'Hide' : 'Show'} detailed instructions
        </button>
        {showIpWarning && (
          <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
            <p className="font-medium mb-1">Find your IP:</p>
            <p><strong>Windows:</strong> Run <code className="bg-white px-1 rounded">ipconfig</code> in terminal</p>
            <p><strong>Mac/Linux:</strong> Run <code className="bg-white px-1 rounded">ifconfig</code> in terminal</p>
            <p className="mt-2">Look for IPv4 address like: <code className="bg-white px-1 rounded">192.168.1.100</code></p>
            <p className="mt-2">Then use: <code className="bg-white px-1 rounded">http://YOUR_IP:3000/track/{trackingCode}</code></p>
          </div>
        )}
      </div>
    );
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-${orderId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size + 40;
    canvas.height = size + 40;

    img.onload = () => {
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 20, 20, size, size);
        
        // Download
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `order-${orderId}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        toast.success('QR Code downloaded!');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      toast.success('Tracking link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Track Order #${orderId}`,
          text: `Track your order using this link`,
          url: trackingUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Tracking QR Code</h3>
        <p className="text-sm text-gray-600">Scan to track your order in real-time</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
        <QRCodeSVG
          id={`qr-${orderId}`}
          value={trackingUrl}
          size={size}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: '/logo.png', // Optional: Add your logo in the center
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      {/* Tracking Code */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-600 mb-1">Tracking Code</div>
        <div className="font-mono text-sm font-semibold text-gray-900">{trackingCode}</div>
      </div>

      {/* Tracking URL */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <div className="text-xs text-blue-600 mb-1">Tracking URL</div>
        <div className="text-xs font-mono text-blue-900 break-all">{trackingUrl}</div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleDownloadQR}
          className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Download</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-5 h-5 mb-1" /> : <Copy className="w-5 h-5 mb-1" />}
          <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
        >
          <Share2 className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          💡 <strong>Tip:</strong> Share this QR code with delivery personnel or anyone who needs to track this order. No login required!
        </p>
      </div>

      {/* Localhost Warning for Phone Scanning */}
      {getLocalIpHint()}
    </div>
  );
}
