import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `Role: You are "Krishi Guru," a dedicated agricultural expert specializing in Indian farming. Your purpose is to provide technical, botanical, and practical guidance to farmers across India.

1. Defining "Agriculture":
Answer any questions regarding:
- Crop Botany: Identifying and describing plants/fruits/vegetables (e.g., "What is a lemon?", "Tell me about Mango").
- Cultivation: Sowing, harvesting, soil health, and fertilizers (NPK).
- Protection: Pest control, fungicides, and pesticides.
- Livestock & Support: Cattle, poultry, PM-Kisan, and Mandi trade.

2. The Out-of-Bounds Protocol:
If the question is entirely unrelated to agriculture (e.g., coding, sports, movies), respond EXACTLY with:
"I apologize, but I can only assist with agriculture and farming-related questions. Please ask me about crops, livestock, soil management, pest control, irrigation, or other farming topics."

3. Botanical Intent Rule:
If asked about a specific plant or fruit, explain what it is and briefly mention its farming relevance in India (e.g., soil type or top-producing states).`;

// ENHANCED KEYWORD LIST
function isAgricultureRelated(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  
  // 1. Broad categories
  const categories = ['crop', 'farm', 'soil', 'seed', 'pest', 'fertilizer', 'irrigation', 'livestock', 'mandi', 'kisan', 'agriculture'];
  
  // 2. Common Indian Crops & Fruits (Added lemon, mango, etc.)
  const plants = [
    'lemon', 'nimbu', 'mango', 'rice', 'wheat', 'paddy', 'tomato', 'potato', 'onion', 
    'chilli', 'cotton', 'sugarcane', 'dal', 'pulse', 'mustard', 'maize', 'corn', 
    'banana', 'guava', 'citrus', 'ginger', 'garlic', 'turmeric'
  ];

  // 3. Livestock
  const animals = ['cow', 'buffalo', 'poultry', 'chicken', 'goat', 'sheep', 'dairy', 'milk'];

  const allKeywords = [...categories, ...plants, ...animals];
  
  // If the question is very short (like "What is a lemon?"), 
  // we check if ANY word in the question is a keyword.
  const words = lowerQuestion.split(/\W+/);
  return words.some(word => allKeywords.includes(word)) || allKeywords.some(kw => lowerQuestion.includes(kw));
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;

    // REVISED VALIDATION LOGIC
    // We only block it if it's long AND doesn't have keywords. 
    // This allows short questions like "What is a lemon?" to pass through to the AI.
    const hasAgriKeywords = isAgricultureRelated(message);
    
    if (!hasAgriKeywords && message.split(' ').length > 3) {
      return NextResponse.json({
        response: "I apologize, but I can only assist with agriculture and farming-related questions. Please ask me about crops, livestock, soil management, pest control, irrigation, or other farming topics."
      });
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        max_tokens: 1024,
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Groq API error:', data.error);
      return NextResponse.json({ 
        response: "I'm temporarily unavailable due to high demand. Please try again in a few minutes." 
      });
    }
    
    const botResponse = data.choices?.[0]?.message?.content;

    return NextResponse.json({ response: botResponse });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}