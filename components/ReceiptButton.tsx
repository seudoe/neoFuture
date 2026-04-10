'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReceiptButtonProps {
  orderId: number;
  receiptUrl?: string;
  receiptGenerated?: boolean;
  orderStatus: string;
}

export default function ReceiptButton({
  orderId,
  receiptUrl,
  receiptGenerated,
  orderStatus,
}: ReceiptButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState(receiptUrl);

  const handleGenerateReceipt = async () => {
    setGenerating(true);
    try {
      console.log('Generating receipt for order:', orderId);
      
      const response = await fetch('/api/generate-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();
      console.log('Receipt generation result:', result);

      if (result.success) {
        setCurrentReceiptUrl(result.receiptUrl);
        toast.success('Receipt generated successfully!');
        // Reload page to update order data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.error('Receipt generation failed:', result.error);
        toast.error(result.error || 'Failed to generate receipt');
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Error generating receipt. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReceipt = () => {
    if (currentReceiptUrl) {
      window.open(currentReceiptUrl, '_blank');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!currentReceiptUrl) return;

    try {
      const response = await fetch(currentReceiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Receipt downloaded!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Error downloading receipt');
    }
  };

  // Only show for delivered orders
  if (orderStatus !== 'delivered') {
    return null;
  }

  // If receipt exists, show view/download buttons
  if (receiptGenerated && currentReceiptUrl) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleViewReceipt}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
        >
          <FileText className="w-4 h-4" />
          View Receipt
        </button>
        <button
          onClick={handleDownloadReceipt}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    );
  }

  // If receipt not generated, show generate button
  return (
    <button
      onClick={handleGenerateReceipt}
      disabled={generating}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          Generate Receipt
        </>
      )}
    </button>
  );
}
