# Photo Upload Setup Instructions

## Supabase Storage Bucket Setup

To enable photo uploads, you need to create a storage bucket in your Supabase project:

### 1. Create the Products Bucket

1. Go to your Supabase Dashboard: https://ntsoxhlkznakdzvfeimp.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket**
4. Set bucket name as: `Products`
5. Make it **Public** (so images can be displayed)
6. **IMPORTANT**: Turn OFF "Row Level Security" for now to avoid policy errors
7. Click **Create Bucket**

### 2. Fix RLS Policy Issues (Choose Option A or B)

**Option A: Disable RLS (Recommended for development)**
```sql
-- Run this in SQL Editor to disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Option B: Create Proper RLS Policies (For production)**
```sql
-- Enable RLS first
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to Products bucket
CREATE POLICY "Public read access for Products" ON storage.objects
FOR SELECT USING (bucket_id = 'Products');

-- Allow public upload to Products bucket
CREATE POLICY "Public upload to Products" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'Products');

-- Allow public update in Products bucket
CREATE POLICY "Public update in Products" ON storage.objects
FOR UPDATE USING (bucket_id = 'Products');

-- Allow public delete in Products bucket
CREATE POLICY "Public delete in Products" ON storage.objects
FOR DELETE USING (bucket_id = 'Products');
```

### 3. Alternative: Use Supabase Client with Service Role

If you still get RLS errors, update the PhotoUpload component to use the server-side client:

```typescript
// In PhotoUpload.tsx, replace supabaseClient with supabase for uploads
import { supabase } from '@/lib/supabase'; // Service role client

// Then use supabase instead of supabaseClient for uploads
const { data, error } = await supabase.storage
  .from('Products')
  .upload(filePath, file);
```

### 3. Folder Structure

The app will automatically create this folder structure in the `Products` bucket:
```
Products/
├── {userId}/
│   ├── {productId}/
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   └── ...
│   └── {anotherProductId}/
│       ├── photo1.jpg
│       └── ...
└── {anotherUserId}/
    └── ...
```

### 4. Features Implemented

✅ **Photo Upload Component**
- Drag & drop interface
- Multiple file selection
- File type validation (images only)
- File size validation (10MB max per file)
- Preview with thumbnails
- Upload progress indication

✅ **Product Details Modal**
- Image slideshow with navigation
- Thumbnail navigation
- Fallback for missing images
- Full product information display
- Amazon/Flipkart-style layout

✅ **Integration**
- Farmer dashboard: Photo upload in "Add Product" form
- Farmer dashboard: Edit products with photo management
- Buyer dashboard: Clickable product cards open detailed view
- Automatic photo display in product listings
- Photo count indicator in farmer's product cards

### 5. Usage

**For Farmers:**
1. **Add Product**: Go to "Add Product" tab, fill details, upload photos, submit
2. **Edit Product**: In "My Crops" tab, click "Edit" on any product card
3. **Manage Photos**: In edit mode, delete existing photos or add new ones
4. **Delete Product**: Use delete button in edit mode (removes all photos too)

**For Buyers:**
1. Go to "Browse Products" tab
2. Click on any product card
3. View detailed product information with photo slideshow
4. Navigate through photos using arrow buttons or thumbnails

### 6. Technical Details

- **Storage**: Supabase Storage with public bucket
- **File Organization**: `userId/productId/filename.ext`
- **Database**: Photo URLs stored in `products.photos` array field
- **Components**: Reusable PhotoUpload and ProductDetails components
- **Error Handling**: Graceful fallbacks for missing images