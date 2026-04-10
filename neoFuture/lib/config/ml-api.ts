// ML API Configuration
export const ML_API_CONFIG = {
  // Uses environment variable or fallback URL
  BASE_URL: process.env.NEXT_PUBLIC_ML_API || "https://YOUR-NGROK-URL.ngrok-free.app/predict",
  HEADERS: {
    // CRITICAL: Bypasses the Ngrok "Visit Site" warning page
    "ngrok-skip-browser-warning": "true",
    // Add additional headers for better compatibility
    "Accept": "application/json",
  },
  // Timeout configuration
  TIMEOUT: 15000, // 15 seconds
};

// Helper to get the API URL (since the env var includes the full endpoint)
export const getApiUrl = (): string => {
  return ML_API_CONFIG.BASE_URL;
};

// Helper to check if ML API is properly configured
export const isMLApiConfigured = (): boolean => {
  const url = getApiUrl();
  return !!(url && !url.includes('YOUR-NGROK-URL') && url !== 'https://YOUR-NGROK-URL.ngrok-free.app/predict');
};