'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, ImageIcon, Plus, Tag, Calculator, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PhotoUpload from './PhotoUpload';
import { supabaseClient } from '@/lib/supabase';

interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price_single: number;
  price_multiple: number | null;
  location: string;
  description: string;
  status: string;
  seller_name: string;
  seller_phone: string;
  photos?: string[];
}

interface EditProductProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  onDelete: (productId: number) => void;
  userId: number;
}

export default function EditProduct({ 
  product, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  userId 
}: EditProductProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    quantity: product.quantity,
    price_single: product.price_single,
    price_multiple: product.price_multiple ?? '',
    location: product.location,
    description: product.description,
    status: product.status
  });
  const [photos, setPhotos] = useState<string[]>(product.photos || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        price_single: product.price_single,
        price_multiple: product.price_multiple ?? '',
        location: product.location,
        description: product.description,
        status: product.status
      });
      setPhotos(product.photos || []);
    }
  }, [product]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' 
        ? parseInt(value) || 0 
        : name === 'price_single' || name === 'price_multiple'
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleDeletePhoto = async (photoUrl: string, index: number) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${userId}/${product.id}/${fileName}`;

      // Delete from Supabase Storage
      const { error } = await supabaseClient.storage
        .from('products')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting photo:', error);
      }

      // Remove from local state
      const updatedPhotos = photos.filter((_, i) => i !== index);
      setPhotos(updatedPhotos);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handlePhotosUploaded = (newPhotoUrls: string[]) => {
    setPhotos(prev => [...prev, ...newPhotoUrls]);
    setSelectedFiles([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Product object:', product);
      console.log('Product ID:', product.id);
      console.log('Product ID type:', typeof product.id);
      console.log('Update data:', { ...formData, photos });
      
      const url = `/api/products/${product.id}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photos
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        // Add seller info back to the product for display
        const updatedProduct = {
          ...result.product,
          seller_name: product.seller_name
        };
        onSave(updatedProduct);
        onClose();
        toast.success('Product updated successfully!');
      } else {
        console.error('Failed to update product:', result);
        toast.error(`Failed to update product: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      console.log('Delete - Product object:', product);
      console.log('Delete - Product ID:', product.id);
      console.log('Delete - Product ID type:', typeof product.id);
      
      // Delete all photos from storage first
      if (photos.length > 0) {
        console.log('Deleting photos from storage...');
        const filePaths = photos.map(photoUrl => {
          const urlParts = photoUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          return `${userId}/${product.id}/${fileName}`;
        });

        const { error: storageError } = await supabaseClient.storage
          .from('products')
          .remove(filePaths);

        if (storageError) {
          console.error('Error deleting photos from storage:', storageError);
        }
      }

      // Delete product from database
      const url = `/api/products/${product.id}`;
      console.log('Delete request URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);
      const result = await response.json();
      console.log('Delete response data:', result);

      if (response.ok && result.success) {
        onDelete(product.id);
        onClose();
        toast.success('Product deleted successfully!');
      } else {
        console.error('Failed to delete product:', result);
        toast.error(`Failed to delete product: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product. Please try again.');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select 
                name="category" 
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
              >
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="herbs">Herbs & Spices</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Quantity (kg)
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select 
                name="status" 
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="sold_out">Sold Out</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Single Unit Price (₹/kg)
              </label>
              <input
                type="number"
                name="price_single"
                value={formData.price_single}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calculator className="w-4 h-4 inline mr-1" />
                Bulk Price (₹/kg)
              </label>
              <input
                type="number"
                name="price_multiple"
                value={formData.price_multiple}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-gray-900"
            />
          </div>

          {/* Current Photos */}
          {photos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Photos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo, index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Plus className="w-4 h-4 inline mr-1" />
              Add More Photos
            </label>
            <PhotoUpload
              onPhotosChange={setSelectedFiles}
              onUploadComplete={handlePhotosUploaded}
              userId={userId}
              productId={product.id}
              maxPhotos={5 - photos.length}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Product</span>
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Product
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{product.name}"? This action cannot be undone and will also delete all associated photos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}