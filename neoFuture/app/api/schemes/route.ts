import { NextRequest, NextResponse } from 'next/server';

interface GovernmentScheme {
  title: string;
  description: string;
  link: string;
}

interface SchemesResponse {
  schemes: GovernmentScheme[];
}

export async function GET(request: NextRequest) {
  try {
    // Get API key from environment
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY not configured');
      return NextResponse.json(
        { error: 'Schemes service is not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching government agricultural schemes...');

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides accurate information about government schemes for farmers. Always provide the response in valid JSON format only, without any additional text or markdown formatting."
          },
          {
            role: "user",
            content: `Please provide the top 10 government schemes in India regarding agricultural produce for farmers. For each scheme, include:
- title: The official name of the scheme
- description: A brief description (2-3 sentences) of what the scheme offers
- link: An official government website link for more information

Return the data as a JSON array with exactly this structure:
{
  "schemes": [
    {
      "title": "Scheme Name",
      "description": "Brief description",
      "link": "https://official-link.gov.in"
    }
  ]
}`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 2048,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API key error. Please check your GROQ_API_KEY configuration.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch schemes data' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    if (!responseText) {
      throw new Error('No response content received');
    }

    // Parse the JSON response
    let schemes: SchemesResponse;
    try {
      // Clean the response text in case there are any extra characters
      const cleanedResponse = responseText.trim();
      schemes = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    if (!schemes.schemes || !Array.isArray(schemes.schemes)) {
      throw new Error('Invalid response structure');
    }

    // Validate each scheme has required fields
    const validSchemes = schemes.schemes.filter(scheme => 
      scheme.title && scheme.description && scheme.link
    );

    if (validSchemes.length === 0) {
      throw new Error('No valid schemes found in response');
    }

    console.log(`Successfully fetched ${validSchemes.length} government schemes`);

    return NextResponse.json({ 
      schemes: validSchemes,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Schemes API error:', error);
    
    // Return fallback schemes in case of API failure
    const fallbackSchemes: SchemesResponse = {
      schemes: [
        {
          title: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
          description: "Direct income support of ₹6,000 per year to small and marginal farmers. The amount is transferred in three equal installments of ₹2,000 each directly to farmers' bank accounts.",
          link: "https://pmkisan.gov.in/"
        },
        {
          title: "Kisan Credit Card (KCC)",
          description: "Provides farmers with timely access to credit for agricultural needs including crop production, post-harvest expenses, and consumption requirements at subsidized interest rates.",
          link: "https://www.nabard.org/content1.aspx?id=570&catid=23"
        },
        {
          title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
          description: "Crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests, and diseases with very low premium rates.",
          link: "https://pmfby.gov.in/"
        },
        {
          title: "Soil Health Card Scheme",
          description: "Provides farmers with soil health cards containing crop-wise recommendations of nutrients and fertilizers required for individual farms to improve productivity.",
          link: "https://soilhealth.dac.gov.in/"
        },
        {
          title: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY)",
          description: "Aims to expand cultivated area under assured irrigation, improve water use efficiency, and adopt precision irrigation and other water saving technologies.",
          link: "https://pmksy.gov.in/"
        }
      ]
    };

    return NextResponse.json({ 
      schemes: fallbackSchemes.schemes,
      lastUpdated: new Date().toISOString(),
      note: "Showing cached schemes due to service unavailability"
    });
  }
}