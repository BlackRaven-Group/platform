/**
 * LeakOSINT API Integration
 * Documentation: https://leakosintapi.com/
 * 
 * API for searching leaked data in databases
 */

export interface LeakOSINTRequest {
  token: string;
  request: string | string[];
  limit?: number; // 100-10000, default 100
  lang?: string; // default "en"
  type?: 'json' | 'short' | 'html'; // default "json"
  bot_name?: string; // @name format if not main bot
}

export interface LeakOSINTResponse {
  List: Record<string, {
    InfoLeak: string;
    Data: Record<string, string>[];
  }>;
  Error?: string;
  'Error code'?: string;
}

const API_URL = 'https://leakosintapi.com/';

/**
 * Search for leaked data using LeakOSINT API
 */
export async function searchLeakOSINT(
  query: string | string[],
  options: {
    limit?: number;
    lang?: string;
    type?: 'json' | 'short' | 'html';
  } = {}
): Promise<LeakOSINTResponse> {
  const token = import.meta.env.VITE_LEAKOSINT_API_TOKEN || '1084286392:zGIJBluG';
  
  const request: LeakOSINTRequest = {
    token,
    request: query,
    limit: options.limit || 100,
    lang: options.lang || 'en',
    type: options.type || 'json'
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data['Error code']) {
      throw new Error(`API Error: ${data['Error code']}`);
    }

    return data;
  } catch (error) {
    console.error('LeakOSINT API error:', error);
    throw error;
  }
}

/**
 * Calculate request complexity based on number of words
 */
export function calculateComplexity(query: string): number {
  // Remove dates, short strings (<4 chars), short numbers (<6 chars)
  const words = query
    .split(/\s+/)
    .filter(word => {
      // Skip dates (various formats)
      if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(word)) return false;
      // Skip short strings
      if (word.length < 4) return false;
      // Skip short numbers
      if (/^\d+$/.test(word) && word.length < 6) return false;
      return true;
    });

  const wordCount = words.length;
  
  if (wordCount === 1) return 1;
  if (wordCount === 2) return 5;
  if (wordCount === 3) return 16;
  return 40; // More than 3 words
}

/**
 * Calculate request cost in USD
 */
export function calculateCost(limit: number, complexity: number): number {
  return 0.0002 * (5 + Math.sqrt(limit * complexity));
}
