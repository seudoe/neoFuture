'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void;
  onUploadComplete?: (photoUrls: string[]) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
  userId?: number;
  productId?: number;
}

export default function PhotoUpload({ 
  onPhotosChange, 
  onUploadComplete,
  maxPhotos = 5, 
  existingPhotos = [],
  userId,
  productId
}: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<{latitude: number, longitude: number, address?: string} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Upload files to Supabase storage
  const uploadFiles = async (files: File[]) => {
    if (!userId || !productId) {
      console.error('userId and productId are required for upload');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId.toString());
        formData.append('productId', productId.toString());

        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.url) {
          uploadedUrls.push(result.url);
        } else {
          const errMsg = result.error || 'Unknown error';
          console.error('Failed to upload file:', file.name, errMsg);
          toast.error(`Failed to upload ${file.name}: ${errMsg}`);
        }
      }

      if (uploadedUrls.length > 0 && onUploadComplete) {
        onUploadComplete(uploadedUrls);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Get user location and address on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          // Get address from coordinates using reverse geocoding
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${coords.latitude}+${coords.longitude}&key=YOUR_API_KEY&limit=1`
            );
            
            // Fallback to a free service if OpenCage is not available
            const fallbackResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`
            );
            
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              const address = data.display_name || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
              setLocation({ ...coords, address });
            } else {
              setLocation(coords);
            }
          } catch (error) {
            console.warn('Geocoding error:', error);
            setLocation(coords);
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    }
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Add effect to handle video stream when it changes
  useEffect(() => {
    if (stream && videoRef.current && isCameraOpen) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        video.play().catch(error => {
          console.error('Error playing video:', error);
        });
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [stream, isCameraOpen]);

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions and try again.');
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast.error('Unable to capture photo. Please try again.');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas (capture exactly what's shown)
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add geolocation overlay if available
    if (location) {
      const overlayHeight = location.address ? 100 : 60;
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(10, canvas.height - overlayHeight - 10, canvas.width - 20, overlayHeight);
      
      context.fillStyle = 'white';
      context.font = 'bold 18px Arial';
      context.fillText('📍 Location:', 20, canvas.height - overlayHeight + 25);
      
      if (location.address) {
        context.font = '14px Arial';
        // Wrap long addresses
        const maxWidth = canvas.width - 40;
        const words = location.address.split(' ');
        let line = '';
        let y = canvas.height - overlayHeight + 50;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, 20, y);
            line = words[n] + ' ';
            y += 18;
          } else {
            line = testLine;
          }
        }
        context.fillText(line, 20, y);
      } else {
        context.font = '14px Arial';
        context.fillText(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`, 20, canvas.height - overlayHeight + 50);
      }
    }

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Failed to capture photo. Please try again.');
        return;
      }

      // Create file with geolocation metadata
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `camera-capture-${timestamp}.jpg`;
      
      // Create a new File object with metadata
      const file = new File([blob], fileName, { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      // Add geolocation as custom property (for reference)
      if (location) {
        (file as any).geolocation = location;
        (file as any).locationAddress = location.address;
      }

      const totalFiles = selectedFiles.length + 1;
      if (totalFiles > maxPhotos) {
        toast.error(`You can only upload up to ${maxPhotos} photos`);
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviews(prev => [...prev, preview]);

      // Close camera after capture
      closeCamera();

      // Upload immediately if userId and productId are provided
      if (userId && productId) {
        await uploadFiles([file]);
        toast.success('Photo captured and uploaded successfully!');
      } else {
        // Store locally if no upload info
        const updatedFiles = [...selectedFiles, file];
        setSelectedFiles(updatedFiles);
        onPhotosChange(updatedFiles);
        toast.success('Photo captured successfully! It will be uploaded with your product.');
      }
    }, 'image/jpeg', 0.9);
  };

  const removePhoto = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    setSelectedFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onPhotosChange(updatedFiles);
  };

  return (
    <div className="space-y-4">
      {/* Camera View */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Camera Header */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-b from-black to-transparent text-white z-40">
            <h3 className="text-lg font-semibold">Take Photo</h3>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeCamera();
              }}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Video Preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Loading indicator */}
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Location Overlay */}
          {location && (
            <div className="absolute top-20 left-4 right-4 bg-black bg-opacity-80 text-white px-4 py-3 rounded-lg z-30">
              <div className="flex items-start">
                <span className="text-green-400 mr-2 mt-0.5">📍</span>
                <div className="flex-1">
                  {locationLoading ? (
                    <span className="text-sm">Getting location...</span>
                  ) : location.address ? (
                    <div>
                      <div className="text-sm font-medium">Current Location:</div>
                      <div className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {location.address}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CAPTURE BUTTON - FIXED POSITION */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                capturePhoto();
              }}
              className="w-20 h-20 bg-white rounded-full shadow-2xl border-4 border-white hover:border-green-400 active:scale-95 transition-all duration-200 flex items-center justify-center"
              style={{ 
                boxShadow: '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4)',
                zIndex: 9999
              }}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-700" />
              </div>
            </button>
          </div>

          {/* Capture Instructions */}
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-center">
              <p className="text-sm font-medium">Tap to capture</p>
            </div>
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Camera Only */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openCamera();
            }}
            disabled={uploading}
            className="w-full border-2 border-dashed border-green-300 hover:border-green-400 rounded-lg p-8 text-center cursor-pointer transition-colors bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg text-green-700 font-medium mb-2">
              Take Photo
            </p>
            <p className="text-sm text-green-600">
              Capture product photos with location
            </p>
            {location && !locationLoading ? (
              <p className="text-xs text-green-600 mt-2">
                📍 {location.address ? 'Address found' : 'Location enabled'}
              </p>
            ) : locationLoading ? (
              <p className="text-xs text-yellow-600 mt-2">
                📍 Getting location...
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                📍 Location unavailable
              </p>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Max {maxPhotos} photos using camera with automatic location tagging
      </p>

      {/* Photo Previews */}
      {previews.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Photos ({previews.length})</h4>
          {uploading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-sm text-blue-700 font-medium">Uploading photos...</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removePhoto(index);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  <div>{selectedFiles[index] ? (selectedFiles[index].size / 1024 / 1024).toFixed(1) + 'MB' : 'Uploaded'}</div>
                  {selectedFiles[index] && (selectedFiles[index] as any).geolocation && (
                    <div className="text-green-400 flex items-center">
                      📍 <span className="ml-1">Located</span>
                    </div>
                  )}
                </div>
                {/* Photo type indicator */}
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  📷 Camera
                </div>
                {/* Upload status indicator */}
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!uploading && previews.length > 0 && userId && productId && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✓ {previews.length} photo{previews.length > 1 ? 's' : ''} uploaded successfully
              </p>
            </div>
          )}
          {!uploading && previews.length > 0 && (!userId || !productId) && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 font-medium">
                ⏳ {previews.length} photo{previews.length > 1 ? 's' : ''} ready to upload with product
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Photos will be automatically uploaded when you submit the form
              </p>
            </div>
          )}
        </div>
      )}

      {/* Remove the Upload Button section since we'll upload with form submission */}

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Photos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {existingPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo}
                  alt={`Existing ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}