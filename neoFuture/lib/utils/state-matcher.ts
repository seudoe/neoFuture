// Smart state name matcher for Indian states with misspell detection

export interface StateMapping {
  official: string;
  variations: string[];
}

// Comprehensive mapping of Indian states with common misspellings and variations
const STATE_MAPPINGS: StateMapping[] = [
  {
    official: 'Gujarat',
    variations: ['gujarat', 'gujrat', 'gujart', 'gujurat', 'gujraat', 'guj', 'gujju']
  },
  {
    official: 'Maharashtra',
    variations: ['maharashtra', 'maharastra', 'maha', 'mh', 'mumbai state', 'pune state']
  },
  {
    official: 'Punjab',
    variations: ['punjab', 'panjab', 'punjaab', 'pb', 'punjabi state']
  },
  {
    official: 'Haryana',
    variations: ['haryana', 'hariyana', 'hariana', 'hr', 'hry']
  },
  {
    official: 'Rajasthan',
    variations: ['rajasthan', 'rajsthan', 'rajasthaan', 'raj', 'rj', 'rajputana']
  },
  {
    official: 'Uttar Pradesh',
    variations: ['uttar pradesh', 'up', 'u.p', 'uttarpradesh', 'uttar', 'pradesh']
  },
  {
    official: 'Madhya Pradesh',
    variations: ['madhya pradesh', 'mp', 'm.p', 'madhyapradesh', 'madhya', 'central india']
  },
  {
    official: 'Karnataka',
    variations: ['karnataka', 'karnatak', 'karnata', 'kr', 'bangalore state']
  },
  {
    official: 'Tamil Nadu',
    variations: ['tamil nadu', 'tamilnadu', 'tn', 't.n', 'tamil', 'madras state', 'chennai state']
  },
  {
    official: 'Andhra Pradesh',
    variations: ['andhra pradesh', 'andhra', 'ap', 'a.p', 'andhrapradesh', 'hyderabad state']
  },
  {
    official: 'Telangana',
    variations: ['telangana', 'telengana', 'telangna', 'tg', 'ts']
  },
  {
    official: 'Kerala',
    variations: ['kerala', 'kerla', 'keral', 'kl', 'cochin state']
  },
  {
    official: 'Odisha',
    variations: ['odisha', 'orissa', 'odhisa', 'od', 'or', 'kalinga']
  },
  {
    official: 'West Bengal',
    variations: ['west bengal', 'westbengal', 'bengal', 'wb', 'w.b', 'kolkata state']
  },
  {
    official: 'Bihar',
    variations: ['bihar', 'biharr', 'br', 'patna state']
  },
  {
    official: 'Jharkhand',
    variations: ['jharkhand', 'jharkhnd', 'jharknd', 'jh', 'ranchi state']
  },
  {
    official: 'Assam',
    variations: ['assam', 'asam', 'assaam', 'as', 'guwahati state']
  },
  {
    official: 'Himachal Pradesh',
    variations: ['himachal pradesh', 'himachal', 'hp', 'h.p', 'himachalpradesh', 'shimla state']
  },
  {
    official: 'Uttarakhand',
    variations: ['uttarakhand', 'uttrakhand', 'uttaranchal', 'uk', 'dehradun state']
  },
  {
    official: 'Goa',
    variations: ['goa', 'go', 'panaji state']
  },
  {
    official: 'Chhattisgarh',
    variations: ['chhattisgarh', 'chattisgarh', 'chhatisgarh', 'cg', 'raipur state']
  },
  {
    official: 'Jammu and Kashmir',
    variations: ['jammu and kashmir', 'jammu kashmir', 'j&k', 'jk', 'kashmir', 'jammu']
  },
  {
    official: 'Ladakh',
    variations: ['ladakh', 'ladak', 'leh', 'la']
  },
  {
    official: 'Delhi',
    variations: ['delhi', 'new delhi', 'dl', 'ncr', 'capital']
  },
  {
    official: 'Puducherry',
    variations: ['puducherry', 'pondicherry', 'pondy', 'py', 'puduchery']
  }
];

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Smart state matcher that handles misspellings and variations
 */
export function matchState(input: string): string | null {
  if (!input || input.trim().length < 2) {
    return null;
  }

  const normalizedInput = input.toLowerCase().trim();

  // Step 1: Exact match (case-insensitive)
  for (const mapping of STATE_MAPPINGS) {
    if (mapping.official.toLowerCase() === normalizedInput) {
      return mapping.official;
    }
    
    // Check variations for exact match
    for (const variation of mapping.variations) {
      if (variation === normalizedInput) {
        return mapping.official;
      }
    }
  }

  // Step 2: Starts with match
  for (const mapping of STATE_MAPPINGS) {
    if (mapping.official.toLowerCase().startsWith(normalizedInput)) {
      return mapping.official;
    }
    
    // Check variations for starts with
    for (const variation of mapping.variations) {
      if (variation.startsWith(normalizedInput)) {
        return mapping.official;
      }
    }
  }

  // Step 3: Contains match
  for (const mapping of STATE_MAPPINGS) {
    if (mapping.official.toLowerCase().includes(normalizedInput)) {
      return mapping.official;
    }
    
    // Check variations for contains
    for (const variation of mapping.variations) {
      if (variation.includes(normalizedInput)) {
        return mapping.official;
      }
    }
  }

  // Step 4: Fuzzy matching using Levenshtein distance
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  const maxDistance = Math.max(2, Math.floor(normalizedInput.length * 0.3)); // Allow 30% character difference

  for (const mapping of STATE_MAPPINGS) {
    // Check official name
    const officialDistance = levenshteinDistance(normalizedInput, mapping.official.toLowerCase());
    if (officialDistance <= maxDistance && officialDistance < bestDistance) {
      bestDistance = officialDistance;
      bestMatch = mapping.official;
    }

    // Check variations
    for (const variation of mapping.variations) {
      const variationDistance = levenshteinDistance(normalizedInput, variation);
      if (variationDistance <= maxDistance && variationDistance < bestDistance) {
        bestDistance = variationDistance;
        bestMatch = mapping.official;
      }
    }
  }

  return bestMatch;
}

/**
 * Get suggestions for partial input
 */
export function getStateSuggestions(input: string, limit: number = 5): string[] {
  if (!input || input.trim().length < 1) {
    return [];
  }

  const normalizedInput = input.toLowerCase().trim();
  const suggestions: string[] = [];

  // Find states that start with the input
  for (const mapping of STATE_MAPPINGS) {
    if (mapping.official.toLowerCase().startsWith(normalizedInput)) {
      suggestions.push(mapping.official);
    } else {
      // Check variations
      for (const variation of mapping.variations) {
        if (variation.startsWith(normalizedInput) && !suggestions.includes(mapping.official)) {
          suggestions.push(mapping.official);
          break;
        }
      }
    }
  }

  // If we don't have enough suggestions, add fuzzy matches
  if (suggestions.length < limit) {
    const fuzzyMatches: Array<{state: string, distance: number}> = [];
    
    for (const mapping of STATE_MAPPINGS) {
      if (suggestions.includes(mapping.official)) continue;
      
      const distance = levenshteinDistance(normalizedInput, mapping.official.toLowerCase());
      if (distance <= 3) {
        fuzzyMatches.push({ state: mapping.official, distance });
      }
    }
    
    // Sort by distance and add to suggestions
    fuzzyMatches
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit - suggestions.length)
      .forEach(match => suggestions.push(match.state));
  }

  return suggestions.slice(0, limit);
}