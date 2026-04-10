# Subsidies & Programs Feature

## Overview
The "Subsidies & Programs" feature provides farmers with up-to-date information about Indian government schemes and subsidies for agriculture. This feature is integrated into the Farmer's portal as a dedicated tab.

## Features
- 🏛️ **Latest Government Schemes**: Fetches current agricultural schemes from AI
- 🔄 **Real-time Updates**: Refresh button to get latest information
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 🎯 **Direct Links**: Click to visit official government websites
- 💾 **Fallback Data**: Shows cached schemes if API is unavailable
- 🎨 **Themed UI**: Matches the green agricultural theme

## Technical Implementation

### API Endpoint
- **Route**: `/api/schemes`
- **Method**: GET
- **Response**: JSON array of government schemes

### Components
- `SubsidiesPrograms.tsx` - Main component displaying schemes
- `app/api/schemes/route.ts` - API route for fetching schemes

### Data Structure
```typescript
interface GovernmentScheme {
  title: string;        // Official scheme name
  description: string;  // Brief description (2-3 sentences)
  link: string;        // Official government website
}
```

## Usage

### For Farmers
1. Navigate to the Farmer Dashboard
2. Click on "Subsidies & Programs" tab
3. Browse available government schemes
4. Click "Learn More & Apply" to visit official websites
5. Use the refresh button to get latest updates

### For Developers
The feature uses the existing GROQ_API_KEY from the chatbot integration. No additional configuration required.

## Scheme Information Includes
- **PM-KISAN**: Direct income support scheme
- **Kisan Credit Card**: Agricultural credit facility
- **Pradhan Mantri Fasal Bima Yojana**: Crop insurance
- **Soil Health Card Scheme**: Soil testing and recommendations
- **PMKSY**: Irrigation and water management
- And more schemes as available

## Error Handling
- **API Failures**: Shows fallback schemes with cached data
- **Network Issues**: Retry functionality with user-friendly messages
- **Rate Limiting**: Graceful handling of API rate limits
- **Invalid Data**: Validation and filtering of scheme data

## UI Features
- **Numbered Cards**: Each scheme has a numbered badge
- **Gradient Backgrounds**: Green-themed gradient cards
- **Hover Effects**: Interactive hover animations
- **External Link Icons**: Clear indication of external links
- **Loading States**: Smooth loading animations
- **Last Updated**: Timestamp showing when data was fetched

## Security & Reliability
- **Server-side API calls**: GROQ API key never exposed to client
- **Input validation**: All scheme data is validated before display
- **Safe external links**: Opens in new tab with security attributes
- **Fallback mechanisms**: Always shows some schemes even if API fails

## Future Enhancements
- **Filtering**: Filter schemes by category or eligibility
- **Favorites**: Save frequently accessed schemes
- **Notifications**: Alert when new schemes are available
- **Application Tracking**: Track application status
- **Eligibility Checker**: Check if farmer qualifies for schemes

## Files Modified/Added

### New Files
- `app/api/schemes/route.ts` - API endpoint for schemes
- `components/SubsidiesPrograms.tsx` - Main component
- `SUBSIDIES_FEATURE.md` - This documentation

### Modified Files
- `app/dashboard/farmer/page.tsx` - Added new tab and component

## Testing
The feature includes comprehensive error handling and fallback data to ensure it works even when:
- GROQ API is unavailable
- Network connectivity issues
- Rate limits are exceeded
- Invalid API responses

## Jai Hind! 🇮🇳
This feature helps connect Indian farmers with government support programs to improve agricultural productivity and farmer welfare.