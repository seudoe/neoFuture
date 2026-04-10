import { NextResponse } from 'next/server';

interface SkillScheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  link: string;
  hardcoded?: boolean;
}

// PMKVY is hardcoded with the official registration link
const PMKVY_SCHEME: SkillScheme = {
  id: 'pmkvy',
  name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
  description: 'Flagship skill development scheme providing free short-duration training and certification in agriculture, horticulture, organic farming, and agri-business. Earn a government-recognized certificate and monetary reward upon completion.',
  eligibility: 'Indian citizens aged 15-45 years. No minimum education required for most courses.',
  link: 'https://www.skillindiadigital.gov.in/pmkvy-landing',
  hardcoded: true,
};

async function fetchSchemesFromGroq(): Promise<SkillScheme[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
      stream: false,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides accurate information about Indian government skill development schemes for farmers. Return only valid JSON, no markdown or extra text.',
        },
        {
          role: 'user',
          content: `List 4 Indian government skill development schemes for farmers (exclude PMKVY). For each include:
- name: official scheme name
- description: 2-3 sentence description of what it offers farmers
- eligibility: brief eligibility criteria
- link: the real official government website URL

Return as JSON: { "schemes": [ { "name": "", "description": "", "eligibility": "", "link": "" } ] }`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  const parsed = JSON.parse(text);

  return (parsed.schemes || []).map((s: any, i: number) => ({
    id: `fetched-${i + 1}`,
    name: s.name,
    description: s.description,
    eligibility: s.eligibility,
    link: s.link,
  }));
}

const FALLBACK_SCHEMES: SkillScheme[] = [
  {
    id: 'ddugky',
    name: 'DDU-GKY (Deen Dayal Upadhyaya Grameen Kaushalya Yojana)',
    description: 'Skill training and placement program for rural poor youth in agriculture, horticulture, dairy farming, and agri-business with guaranteed placement support.',
    eligibility: 'Rural youth aged 15-35 years from poor families. Priority to SC/ST/Women/PwD.',
    link: 'https://ddugky.gov.in/',
  },
  {
    id: 'kvk',
    name: 'Krishi Vigyan Kendra (KVK) Training Programs',
    description: 'Hands-on training by ICAR in latest agricultural technologies, crop management, sustainable farming, soil health, and pest management.',
    eligibility: 'All farmers, farm women, and rural youth interested in agriculture.',
    link: 'https://www.icar.gov.in/en/agricultural-extension-division/krishi-vigyan-kendra-kvk-farm-science-centre',
  },
  {
    id: 'rseti',
    name: 'Rural Self Employment Training Institutes (RSETI)',
    description: 'Free residential training by banks in agriculture, animal husbandry, food processing, and rural entrepreneurship with financial literacy support.',
    eligibility: 'Rural youth aged 18-45 years. Preference to BPL families, SC/ST, Women.',
    link: 'https://www.rseti.in/',
  },
  {
    id: 'sidh',
    name: 'Skill India Digital Hub (SIDH)',
    description: 'Central government platform to find, enroll, and track all skill development courses including agriculture and allied sectors.',
    eligibility: 'All Indian citizens. Free registration with Aadhaar.',
    link: 'https://www.skillindiadigital.gov.in/home',
  },
];

export async function GET() {
  // PMKVY is always first and hardcoded
  let rest: SkillScheme[] = [];

  try {
    rest = await fetchSchemesFromGroq();
  } catch (err) {
    console.warn('Groq fetch failed, using fallback schemes:', err);
    rest = FALLBACK_SCHEMES;
  }

  return NextResponse.json({
    schemes: [PMKVY_SCHEME, ...rest],
    lastUpdated: new Date().toISOString(),
  });
}
