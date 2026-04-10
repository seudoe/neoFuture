import { supabase } from './supabase';

export async function uploadReceiptToSupabase(
  orderId: number,
  pdfBlob: Blob
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileName = `receipt-${orderId}.pdf`;
    const filePath = `${fileName}`;

    console.log('Uploading receipt:', { orderId, fileName, blobSize: pdfBlob.size });

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Buffer created, size:', buffer.length);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    console.log('Public URL:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload receipt',
    };
  }
}

export async function createReceiptsBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Checking for receipts bucket...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError.message };
    }

    console.log('Existing buckets:', buckets?.map(b => b.name));

    const bucketExists = buckets?.some(bucket => bucket.name === 'receipts');

    if (!bucketExists) {
      console.log('Creating receipts bucket...');
      
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket('receipts', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return { success: false, error: createError.message };
      }

      console.log('Bucket created successfully');
    } else {
      console.log('Bucket already exists');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in createReceiptsBucket:', error);
    return { success: false, error: error.message };
  }
}
