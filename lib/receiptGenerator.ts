import jsPDF from 'jspdf';

interface ReceiptData {
  orderId: number;
  orderDate: string;
  deliveryDate?: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  farmerName: string;
  farmerEmail: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  trackingCode?: string;
}

export function generateReceiptPDF(data: ReceiptData): Blob {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(34, 197, 94); // Green color
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('AgriLink Receipt', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Digital Transaction Receipt', 105, 30, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Order Information
  let yPos = 55;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: #${data.orderId}`, 20, yPos);
  doc.text(`Status: ${data.status.toUpperCase()}`, 120, yPos);
  
  yPos += 7;
  doc.text(`Order Date: ${new Date(data.orderDate).toLocaleDateString()}`, 20, yPos);
  if (data.deliveryDate) {
    doc.text(`Delivery Date: ${new Date(data.deliveryDate).toLocaleDateString()}`, 120, yPos);
  }
  
  // Buyer & Farmer Information
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Parties', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Buyer:', 20, yPos);
  doc.text('Farmer:', 120, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(data.buyerName, 20, yPos);
  doc.text(data.farmerName, 120, yPos);
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(data.buyerEmail, 20, yPos);
  doc.text(data.farmerEmail, 120, yPos);
  
  doc.setTextColor(0, 0, 0);
  
  // Products Table
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Items', 20, yPos);
  
  yPos += 8;
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Product', 25, yPos);
  doc.text('Quantity', 110, yPos);
  doc.text('Price/Unit', 140, yPos);
  doc.text('Total', 170, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  
  // Table rows
  data.products.forEach((product) => {
    const total = product.quantity * product.price;
    doc.text(product.name, 25, yPos);
    doc.text(`${product.quantity} kg`, 110, yPos);
    doc.text(`Rs ${product.price.toFixed(2)}`, 140, yPos);
    doc.text(`Rs ${total.toFixed(2)}`, 170, yPos);
    yPos += 7;
  });
  
  // Total
  yPos += 5;
  doc.setDrawColor(0, 0, 0);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 120, yPos);
  doc.text(`Rs ${data.totalAmount.toFixed(2)}`, 170, yPos);
  
  // Tracking Code
  if (data.trackingCode) {
    yPos += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Track your order:', 20, yPos);
    yPos += 6;
    doc.setTextColor(37, 99, 235);
    doc.text(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${data.trackingCode}`, 20, yPos);
    doc.setTextColor(0, 0, 0);
  }
  
  // Footer
  yPos = 270;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a digitally generated receipt. No signature required.', 105, yPos, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, yPos + 5, { align: 'center' });
  doc.text('AgriLink - Connecting Farmers & Buyers', 105, yPos + 10, { align: 'center' });
  
  // Return as Blob
  return doc.output('blob');
}
