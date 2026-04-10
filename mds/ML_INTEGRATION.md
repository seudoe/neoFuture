# ML Image Analysis Integration

This document explains how the ML image analysis feature works in the ProductDetails component.

## Overview

The system automatically analyzes product images using a trained ML model to provide:
- **Classification**: Identifies the type/condition of the crop (e.g., "stale_tomato", "fresh_apple")
- **Confidence Score**: How confident the model is in its prediction (percentage)
- **Quality Score**: Overall quality rating from 1-5
- **Analysis Message**: Additional context about the prediction

## Setup

### 1. Configure API URL

Add your ML API URL to `.env.local`:

```env
NEXT_PUBLIC_ML_API=https://your-actual-ngrok-url.ngrok-free.dev/predict
```

**Important**: 
- Use `NEXT_PUBLIC_` prefix so the variable is accessible in the browser
- Include the full URL with `/predict` endpoint
- Restart your development server after adding the environment variable

### 2. Alternative Configuration

If you need to change the URL programmatically, you can still update `lib/config/ml-api.ts`:

```typescript
export const ML_API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_ML_API || "https://fallback-url.com/predict",
  // ... rest of config
};
```

### 2. API Requirements

Your ML API should:
- Accept POST requests to `/predict` endpoint
- Accept `multipart/form-data` with a `file` field
- Return JSON in this format:

```json
{
  "filename": "image.jpg",
  "predicted_class": "stale_tomato",
  "confidence_score": "68.18%",
  "quality_score": 1,
  "message": "Prediction Successful"
}
```

## Features

### Automatic Analysis
- Triggers automatically when user changes images in ProductDetails
- Shows loading state during analysis
- Handles errors gracefully

### Visual Indicators
- **Quality Score**: Color-coded (green=good, yellow=fair, red=poor)
- **Confidence**: Color-coded percentage
- **Progress Bar**: Visual quality indicator
- **Classification Badge**: Formatted class name

### Responsive Design
- Works on all screen sizes
- Integrates seamlessly with existing ProductDetails layout
- Uses gradient background for visual appeal

## Usage

1. Open any product in ProductDetails component
2. The current image is automatically analyzed
3. Results appear below the image slideshow
4. Change images to see analysis update in real-time

## Error Handling

- Network errors: Shows "Analysis failed" message
- Invalid images: Shows "Failed to process image"
- API errors: Logs to console and shows user-friendly message
- Placeholder images: Skips analysis

## Customization

### Styling
Modify the analysis display in `components/ProductDetails.tsx` around line 120.

### API Configuration
Update `lib/config/ml-api.ts` for different endpoints or headers.

### Helper Functions
Available in `lib/services/image-analysis-service.ts`:
- `formatClassName()`: Formats class names for display
- `getQualityColor()`: Returns color classes based on quality score
- `getConfidenceColor()`: Returns color classes based on confidence
- `urlToFile()`: Converts image URLs to File objects

## Development Notes

- Uses React hooks for state management
- Implements proper cleanup and error boundaries
- Optimized for performance with useEffect dependencies
- TypeScript interfaces ensure type safety