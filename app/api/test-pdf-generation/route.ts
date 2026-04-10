import { NextResponse } from 'next/server';
import { generateReceiptPDF } from '@/lib/receiptGenerator';

export async function GET() {
  try {
    console.log('Testing PDF generation...');
    
    const testData = {
      orderId: 999,
      orderDate: new Date().toISOString(),
      deliveryDate: new Date().toISOString(),
      status: 'delivered',
      buyerName: 'Test Buyer',
      buyerEmail: 'buyer@test.com',
      farmerName: 'Test Farmer',
      farmerEmail: 'farmer@test.com',
      products: [
        {
          name: 'Test Product',
          quantity: 10,
          price: 50,
        },
      ],
      totalAmount: 500,
      trackingCode: 'TEST123',
    };

    console.log('Generating PDF with test data...');
    const pdfBlob = generateReceiptPDF(testData);
    
    console.log('PDF generated successfully, size:', pdfBlob.size);

    return NextResponse.json({
      success: true,
      message: 'PDF generation works!',
      pdfSize: pdfBlob.size,
      pdfType: pdfBlob.type
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
