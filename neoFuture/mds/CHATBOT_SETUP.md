# Chatbot Integration Setup

## Overview
The agricultural advisor chatbot has been integrated across all screens of the AgriBridge application. It provides farming advice and answers agriculture-related questions using the Groq API.

## Features
- 🌾 **Agriculture-focused**: Only answers farming, crops, livestock, and agriculture-related questions
- 🎤 **Voice-to-text**: Click the microphone button to speak your questions
- 📱 **Mobile responsive**: Full-screen on mobile, overlay on desktop
- 💬 **Real-time chat**: Instant responses from the AI advisor
- 🔄 **Auto-scroll**: Messages automatically scroll to the latest
- ❌ **Easy close**: Cross button on mobile, click outside on desktop

## Setup Instructions

### 1. Get Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Create a new API key
4. Copy the API key

### 2. Configure Environment
Add your Groq API key to the `.env.local` file:
```
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 3. Test the Integration
1. Start the development server: `npm run dev`
2. Look for the green chat button in the bottom-right corner
3. Click to open the chatbot
4. Try asking: "How do I grow tomatoes?" or "What fertilizer is best for wheat?"

## Usage

### Desktop
- Floating green button in bottom-right corner
- Opens as an overlay (400px wide, 600px tall)
- Click outside to close

### Mobile
- Same floating button
- Opens full-screen
- Cross button in top-left to close

### Voice Input
- Click the microphone button
- Speak your question clearly
- The text will appear in the input field
- Click send or press Enter

## API Endpoints

### POST /api/chatbot
Handles chat messages and returns AI responses.

**Request:**
```json
{
  "message": "How do I grow tomatoes?",
  "conversationHistory": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

**Response:**
```json
{
  "response": "To grow tomatoes, you need well-drained soil..."
}
```

## Files Added/Modified

### New Files
- `app/api/chatbot/route.ts` - API endpoint for chat functionality
- `components/Chatbot.tsx` - Main chatbot component
- `components/ChatbotButton.tsx` - Floating button component
- `types/speech-recognition.d.ts` - TypeScript declarations for Speech API

### Modified Files
- `app/layout.tsx` - Added ChatbotButton to global layout
- `.env.local` - Added GROQ_API_KEY configuration

## Troubleshooting

### Voice Recognition Not Working
- Ensure you're using HTTPS (required for microphone access)
- Check browser permissions for microphone
- Voice recognition works best in Chrome/Edge

### API Errors
- Verify GROQ_API_KEY is correctly set in .env.local
- Check Groq API quota and billing
- Look at browser console for detailed error messages

### Chat Not Opening
- Check browser console for JavaScript errors
- Ensure all components are properly imported
- Verify the floating button is visible (green circle, bottom-right)

## Customization

### Changing the System Prompt
Edit the `SYSTEM_PROMPT` in `app/api/chatbot/route.ts` to modify the chatbot's behavior.

### Styling
The chatbot uses Tailwind CSS classes. Modify the components to match your design system.

### Adding More Languages
Update the speech recognition language in `components/Chatbot.tsx`:
```typescript
recognitionInstance.lang = 'hi-IN'; // For Hindi
```

## Security Notes
- The chatbot only responds to agriculture-related questions
- API key is stored server-side and never exposed to the client
- No chat history is permanently stored
- Voice input is processed locally in the browser