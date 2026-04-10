import { NextResponse } from 'next/server';

interface TrainingCenter {
  id: string;
  name: string;
  type: 'KVK' | 'RSETI';
  location: string;
  state: string;
  district: string;
  contact?: string;
  mapUrl: string;
  website?: string;
}

const trainingCenters: TrainingCenter[] = [
  {
    id: '1',
    name: 'Krishi Vigyan Kendra - Punjab',
    type: 'KVK',
    location: 'Ludhiana, Punjab',
    state: 'Punjab',
    district: 'Ludhiana',
    contact: '+91-161-2401960',
    mapUrl: 'https://www.google.com/maps/search/KVK+Ludhiana+Punjab',
    website: 'https://kvk.icar.gov.in/'
  },
  {
    id: '2',
    name: 'RSETI - Maharashtra',
    type: 'RSETI',
    location: 'Pune, Maharashtra',
    state: 'Maharashtra',
    district: 'Pune',
    contact: '+91-20-26050505',
    mapUrl: 'https://www.google.com/maps/search/RSETI+Pune+Maharashtra',
    website: 'https://www.rseti.org/'
  },
  {
    id: '3',
    name: 'Krishi Vigyan Kendra - Gujarat',
    type: 'KVK',
    location: 'Anand, Gujarat',
    state: 'Gujarat',
    district: 'Anand',
    contact: '+91-2692-261391',
    mapUrl: 'https://www.google.com/maps/search/KVK+Anand+Gujarat',
    website: 'https://kvk.icar.gov.in/'
  },
  {
    id: '4',
    name: 'RSETI - Uttar Pradesh',
    type: 'RSETI',
    location: 'Lucknow, Uttar Pradesh',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    contact: '+91-522-2237191',
    mapUrl: 'https://www.google.com/maps/search/RSETI+Lucknow+UP',
    website: 'https://www.rseti.org/'
  },
  {
    id: '5',
    name: 'Krishi Vigyan Kendra - Karnataka',
    type: 'KVK',
    location: 'Bangalore, Karnataka',
    state: 'Karnataka',
    district: 'Bangalore',
    contact: '+91-80-23330153',
    mapUrl: 'https://www.google.com/maps/search/KVK+Bangalore+Karnataka',
    website: 'https://kvk.icar.gov.in/'
  },
  {
    id: '6',
    name: 'RSETI - Tamil Nadu',
    type: 'RSETI',
    location: 'Coimbatore, Tamil Nadu',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    contact: '+91-422-2211234',
    mapUrl: 'https://www.google.com/maps/search/RSETI+Coimbatore+TN',
    website: 'https://www.rseti.org/'
  },
  {
    id: '7',
    name: 'Krishi Vigyan Kendra - Haryana',
    type: 'KVK',
    location: 'Karnal, Haryana',
    state: 'Haryana',
    district: 'Karnal',
    contact: '+91-184-2267802',
    mapUrl: 'https://www.google.com/maps/search/KVK+Karnal+Haryana',
    website: 'https://kvk.icar.gov.in/'
  },
  {
    id: '8',
    name: 'RSETI - Rajasthan',
    type: 'RSETI',
    location: 'Jaipur, Rajasthan',
    state: 'Rajasthan',
    district: 'Jaipur',
    contact: '+91-141-2227722',
    mapUrl: 'https://www.google.com/maps/search/RSETI+Jaipur+Rajasthan',
    website: 'https://www.rseti.org/'
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      centers: trainingCenters,
      count: trainingCenters.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Training centers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training centers' },
      { status: 500 }
    );
  }
}
