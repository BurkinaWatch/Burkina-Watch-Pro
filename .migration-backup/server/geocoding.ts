// Reverse geocoding service with Google Maps primary and Nominatim fallback

interface GeocodeResult {
  address: string;
  source: 'google' | 'nominatim' | 'fallback';
}

// Simple in-memory cache to avoid repeated API calls
const geocodeCache = new Map<string, GeocodeResult>();

function getCacheKey(lat: number | string, lng: number | string): string {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

async function reverseGeocodeGoogle(lat: number | string, lng: number | string): Promise<string | null> {
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not found');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=fr`
    );

    if (!response.ok) {
      console.error('Google Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    console.warn('Google Geocoding returned no results:', data.status);
    return null;
  } catch (error) {
    console.error('Error calling Google Geocoding API:', error);
    return null;
  }
}

async function reverseGeocodeNominatim(lat: number | string, lng: number | string): Promise<string | null> {
  try {
    // Nominatim requires a User-Agent header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`,
      {
        headers: {
          'User-Agent': 'BurkinaWatch/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.display_name) {
      return data.display_name;
    }

    console.warn('Nominatim returned no results');
    return null;
  } catch (error) {
    console.error('Error calling Nominatim API:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number | string, lng: number | string): Promise<GeocodeResult> {
  // Validate coordinates
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {
      address: `${latitude}, ${longitude}`,
      source: 'fallback'
    };
  }

  // Check cache first
  const cacheKey = getCacheKey(latitude, longitude);
  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Try Google Maps first
  const googleAddress = await reverseGeocodeGoogle(latitude, longitude);
  if (googleAddress) {
    const result: GeocodeResult = {
      address: googleAddress,
      source: 'google'
    };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  // Fallback to Nominatim
  const nominatimAddress = await reverseGeocodeNominatim(latitude, longitude);
  if (nominatimAddress) {
    const result: GeocodeResult = {
      address: nominatimAddress,
      source: 'nominatim'
    };
    geocodeCache.set(cacheKey, result);
    return result;
  }

  // Final fallback: return coordinates
  const result: GeocodeResult = {
    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    source: 'fallback'
  };
  return result;
}
