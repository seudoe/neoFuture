import { ML_API_CONFIG, getApiUrl, isMLApiConfigured } from '../config/ml-api';

export interface PredictionResponse {
  filename: string;
  predicted_class: string;
  confidence_score: string;
  quality_score: number;
  message: string;
}

export const analyzeCropImage = async (file: File): Promise<PredictionResponse | null> => {
  // Validate input
  if (!file || !(file instanceof File)) {
    console.error("Invalid file provided for analysis");
    return null;
  }

  // Check if ML API is configured
  if (!isMLApiConfigured()) {
    console.warn("ML API not configured properly");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ML_API_CONFIG.TIMEOUT);

    const response = await fetch(getApiUrl(), {
      method: "POST",
      body: formData,
      headers: ML_API_CONFIG.HEADERS,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 404) {
        throw new Error("ML service endpoint not found - the prediction service may not be running");
      } else if (response.status === 500) {
        throw new Error("ML service internal error - please try again later");
      } else if (response.status === 403) {
        throw new Error("Access denied to ML service - check configuration");
      } else if (response.status === 502 || response.status === 503) {
        throw new Error("ML service is temporarily unavailable");
      } else {
        throw new Error(`ML service error: ${response.status} ${response.statusText}`);
      }
    }

    const data: PredictionResponse = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid response format from ML service");
    }

    // Ensure all required fields exist with fallbacks
    const validatedData: PredictionResponse = {
      filename: data.filename || file.name || 'unknown',
      predicted_class: data.predicted_class || 'unknown',
      confidence_score: data.confidence_score || '0%',
      quality_score: typeof data.quality_score === 'number' ? data.quality_score : 0,
      message: data.message || 'Analysis completed'
    };

    return validatedData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error("ML API request timed out");
        throw new Error("Analysis timed out - the ML service may be slow or unavailable");
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.error("Network error connecting to ML API:", error);
        throw new Error("Unable to connect to ML analysis service - please check your internet connection");
      } else {
        console.error("Error analyzing image:", error);
        throw error;
      }
    } else {
      console.error("Unknown error analyzing image:", error);
      throw new Error("An unexpected error occurred during analysis");
    }
  }
};

// Helper function to convert image URL to File object
export const urlToFile = async (url: string, filename: string): Promise<File | null> => {
  // Validate inputs
  if (!url || typeof url !== 'string' || !filename || typeof filename !== 'string') {
    console.error("Invalid URL or filename provided");
    return null;
  }

  // Skip placeholder URLs
  if (url.includes('/api/placeholder/') || url.includes('placeholder')) {
    return null;
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Validate that we got a valid image blob
    if (!blob || blob.size === 0) {
      throw new Error("Empty or invalid image data");
    }

    // Check if it's actually an image
    if (!blob.type.startsWith('image/')) {
      throw new Error("File is not a valid image");
    }

    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error("Error converting URL to file:", error);
    return null;
  }
};

// Helper function to format class name for display
export const formatClassName = (className: string | undefined | null): string => {
  if (!className || typeof className !== 'string') {
    return 'Unknown';
  }
  
  try {
    return className
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch (error) {
    return 'Unknown';
  }
};

// Helper function to get quality color based on score
export const getQualityColor = (score: number | undefined | null): string => {
  if (typeof score !== 'number' || isNaN(score)) {
    return 'text-gray-600 bg-gray-50 border-gray-200';
  }
  
  if (score >= 4) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

// Helper function to get confidence color based on percentage
export const getConfidenceColor = (confidence: string | undefined | null): string => {
  if (!confidence || typeof confidence !== 'string') {
    return 'text-gray-600';
  }
  
  try {
    const percentage = parseFloat(confidence.replace('%', ''));
    if (isNaN(percentage)) return 'text-gray-600';
    
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  } catch (error) {
    return 'text-gray-600';
  }
};