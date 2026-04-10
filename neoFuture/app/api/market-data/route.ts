import { NextRequest, NextResponse } from 'next/server';

interface RawMarketRecord {
  // New API (lowercase)
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  arrival_date?: string;
  min_price?: number | string;
  max_price?: number | string;
  modal_price?: number | string;
  // Old API (capitalized)
  State?: string;
  District?: string;
  Market?: string;
  Commodity?: string;
  Variety?: string;
  Grade?: string;
  Arrival_Date?: string;
  Min_Price?: string;
  Max_Price?: string;
  Modal_Price?: string;
}

interface MarketRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrivalDate: string;
  arrivalDateObj: Date;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

interface PricePrediction {
  commodity: string;
  latestDate: string;
  records: MarketRecord[];
  summary: {
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    marketCount: number;
  };
}

/**
 * Convert DD/MM/YYYY → Date object
 */
function parseArrivalDate(dateStr: string): Date {
  try {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year || day > 31 || month > 12 || year < 1900) {
      throw new Error('Invalid date format');
    }
    return new Date(year, month - 1, day);
  } catch (error) {
    throw new Error(`Failed to parse date: ${dateStr}`);
  }
}

/**
 * Normalize raw government record
 */
function normalizeRecord(rawRecord: RawMarketRecord): MarketRecord {
  try {
    // Support both new lowercase and old capitalized field names
    const minPrice = Number(rawRecord.min_price ?? rawRecord.Min_Price);
    const maxPrice = Number(rawRecord.max_price ?? rawRecord.Max_Price);
    const modalPrice = Number(rawRecord.modal_price ?? rawRecord.Modal_Price);
    const arrivalDate = (rawRecord.arrival_date ?? rawRecord.Arrival_Date) as string;

    if (isNaN(minPrice) || isNaN(maxPrice) || isNaN(modalPrice) ||
        minPrice < 0 || maxPrice < 0 || modalPrice < 0) {
      throw new Error('Invalid price data');
    }

    return {
      state: (rawRecord.state ?? rawRecord.State) as string,
      district: (rawRecord.district ?? rawRecord.District) as string,
      market: (rawRecord.market ?? rawRecord.Market) as string,
      commodity: (rawRecord.commodity ?? rawRecord.Commodity) as string,
      variety: (rawRecord.variety ?? rawRecord.Variety) as string,
      grade: (rawRecord.grade ?? rawRecord.Grade) as string,
      arrivalDate,
      arrivalDateObj: parseArrivalDate(arrivalDate),
      minPrice,
      maxPrice,
      modalPrice
    };
  } catch (error) {
    throw new Error(`Failed to normalize record: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find most recent arrival date from records
 */
function findLatestRecords(records: MarketRecord[]): MarketRecord[] {
  if (records.length === 0) return [];

  // Find the most recent date
  const latestDateObj = records.reduce((latest, record) =>
    record.arrivalDateObj > latest ? record.arrivalDateObj : latest,
    records[0].arrivalDateObj
  );

  // Filter records for that date only
  return records.filter(record => 
    record.arrivalDateObj.getTime() === latestDateObj.getTime()
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('productName');
    const state = searchParams.get('state');

    console.log('Market data API called with:', { productName, state });
    
    if (state) {
      console.log(`🎯 Using state-based search for: ${state}`);
    } else {
      console.log('🌍 Using nationwide search (no state specified)');
    }

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Get API configuration from environment
    const apiKey = process.env.MARKET_DATA_API_KEY;
    const apiUrl = process.env.MARKET_DATA_API_URL || 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24';

    console.log('API Key available:', !!apiKey);
    console.log('API URL:', apiUrl);

    if (!apiKey) {
      console.error('MARKET_DATA_API_KEY not configured');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Common commodity mappings for better matching
    const commodityMappings: { [key: string]: string[] } = {
      'tomato': ['Tomato'],
      'tomatoes': ['Tomato'],
      'onion': ['Onion'],
      'onions': ['Onion'],
      'potato': ['Potato'],
      'potatoes': ['Potato'],
      'rice': ['Rice', 'Paddy', 'Paddy(Dhan)(Common)', 'Paddy(Dhan)(Hybrid)'],
      'wheat': ['Wheat', 'Wheat(Dara)'],
      'beans': ['Beans'],
      'bean': ['Beans'],
      'brinjal': ['Brinjal'],
      'eggplant': ['Brinjal'],
      'cabbage': ['Cabbage'],
      'carrot': ['Carrot'],
      'cauliflower': ['Cauliflower'],
      'green chilli': ['Green Chilli'],
      'chilli': ['Green Chilli'],
      'pepper': ['Green Chilli'],
      'ginger': ['Ginger'],
      'garlic': ['Garlic'],
      'coriander': ['Coriander'],
      'spinach': ['Spinach'],
      'okra': ['Bhindi(Ladies Finger)'],
      'ladyfinger': ['Bhindi(Ladies Finger)'],
      'cucumber': ['Cucumber'],
      'bitter gourd': ['Bitter gourd'],
      'bottle gourd': ['Bottle gourd'],
      'pumpkin': ['Pumpkin'],
      'sweet potato': ['Sweet Potato'],
      'radish': ['Raddish'],
      'beetroot': ['Beetroot'],
      'lemon': ['Lemon'],
      'lime': ['Lemon'],
      'banana': ['Banana'],
      'apple': ['Apple'],
      'orange': ['Orange'],
      'mango': ['Mango'],
      'grapes': ['Grapes'],
      'papaya': ['Papaya'],
      'watermelon': ['Water Melon'],
      'coconut': ['Coconut'],
      'groundnut': ['Groundnut'],
      'peanut': ['Groundnut'],
      'sesame': ['Sesame'],
      'mustard': ['Mustard'],
      'turmeric': ['Turmeric'],
      'red chilli': ['Red Chilli'],
      'black pepper': ['Black pepper'],
      'cardamom': ['Cardamom'],
      'cloves': ['Cloves'],
      'cinnamon': ['Cinnamon'],
      'cumin': ['Cumin'],
      'fenugreek': ['Fenugreek'],
      'ajwain': ['Ajwain'],
      'fennel': ['Fennel'],
      'dill': ['Dill'],
      'mint': ['Mint'],
      'curry leaves': ['Curry Leaves']
    };

    // Find matching commodities
    const searchTerm = productName.toLowerCase().trim();
    let commoditiesToTry: string[] = [];

    // Direct mapping
    if (commodityMappings[searchTerm]) {
      commoditiesToTry = commodityMappings[searchTerm];
    } else {
      // Fuzzy matching
      for (const [key, values] of Object.entries(commodityMappings)) {
        if (key.includes(searchTerm) || searchTerm.includes(key)) {
          commoditiesToTry.push(...values);
        }
      }
      
      // If no fuzzy match, try the original term and common variations
      if (commoditiesToTry.length === 0) {
        commoditiesToTry = [
          productName, // Original
          productName.charAt(0).toUpperCase() + productName.slice(1).toLowerCase(), // Capitalize first letter
          productName.toUpperCase(), // All caps
          productName.toLowerCase() // All lowercase
        ];
      }
    }

    console.log('Trying commodities:', commoditiesToTry);

    // Try each commodity until we find data
    for (const commodity of commoditiesToTry) {
      console.log(`Trying commodity: ${commodity}`);
      
      // Build API request parameters
      const params = new URLSearchParams({
        'api-key': apiKey,
        format: 'json',
        'filters[commodity]': commodity,
        limit: '20'
      });

      if (state) {
        params.append('filters[state]', state);
      }

      const url = `${apiUrl}?${params.toString()}`;
      console.log('Making request to:', url);

      try {
        // Make API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AgriBridge-PricePrediction/1.0'
          }
        });

        clearTimeout(timeoutId);

        console.log(`API response status for ${commodity}:`, response.status);

        if (!response.ok) {
          console.error(`API request failed for ${commodity}: ${response.status} ${response.statusText}`);
          continue; // Try next commodity
        }

        const data = await response.json();
        const rawRecords = data.records || [];

        console.log(`Raw records received for ${commodity}:`, rawRecords.length);

        if (rawRecords.length === 0) {
          continue; // Try next commodity
        }

        // Normalize and validate records
        const validRecords: MarketRecord[] = [];
        for (const rawRecord of rawRecords) {
          try {
            const normalized = normalizeRecord(rawRecord);
            validRecords.push(normalized);
          } catch (error) {
            // Skip invalid records but continue processing
            console.warn('Skipping invalid record:', error);
          }
        }

        if (validRecords.length === 0) {
          continue; // Try next commodity
        }

        // Get latest date records
        const latestRecords = findLatestRecords(validRecords);

        // Calculate summary statistics
        const minPrice = Math.min(...latestRecords.map(r => r.minPrice));
        const maxPrice = Math.max(...latestRecords.map(r => r.maxPrice));
        const modalPrice = Math.round(
          latestRecords.reduce((sum, r) => sum + r.modalPrice, 0) / latestRecords.length
        );

        const prediction: PricePrediction = {
          commodity: latestRecords[0].commodity,
          latestDate: latestRecords[0].arrivalDate,
          records: latestRecords,
          summary: {
            minPrice,
            maxPrice,
            modalPrice,
            marketCount: latestRecords.length
          }
        };

        console.log(`Success! Found data for ${commodity}:`, {
          commodity: prediction.commodity,
          marketCount: prediction.summary.marketCount,
          latestDate: prediction.latestDate,
          markets: latestRecords.slice(0, 3).map(r => `${r.market}, ${r.district}`).join('; ')
        });

        return NextResponse.json({ prediction });

      } catch (error) {
        console.error(`Error fetching data for ${commodity}:`, error);
        continue; // Try next commodity
      }
    }

    // No data found for any commodity variation
    console.log('No data found for any commodity variation');
    return NextResponse.json({ prediction: null });

  } catch (error) {
    console.error('Market data API error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}