/**
 * Geocoding utilities using Mapbox Geocoding API
 * Converts addresses, zipcodes, and place names to coordinates
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  city: string;
  country: string;
  formattedAddress: string;
}

const MAPBOX_API_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Geocode a zipcode/postal code to coordinates
 * @param zipcode - The postal/zip code to geocode
 * @param country - Optional country code to improve accuracy (e.g., 'ie', 'fi')
 * @returns Geocoding result with coordinates and location details
 */
export async function geocodeZipcode(
  zipcode: string,
  country?: string
): Promise<GeocodingResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
    return null;
  }

  try {
    // Clean and validate zipcode
    const cleanZipcode = zipcode.trim().replace(/\s+/g, ' ');

    if (!cleanZipcode) {
      console.error('Invalid zipcode provided');
      return null;
    }

    // Build search query with country filter if provided
    const searchQuery = country
      ? `${cleanZipcode}, ${country.toUpperCase()}`
      : cleanZipcode;

    // Build URL with parameters
    const params = new URLSearchParams({
      access_token: token,
      types: 'postcode,place', // Search for postal codes and places
      limit: '1', // Only need the best match
    });

    // Add country filter if provided
    if (country) {
      params.append('country', country.toLowerCase());
    }

    const url = `${MAPBOX_API_URL}/${encodeURIComponent(searchQuery)}.json?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Mapbox API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn('No results found for zipcode:', zipcode);
      return null;
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;

    // Extract city and country from context
    let city = '';
    let countryName = '';

    if (feature.context) {
      const placeContext = feature.context.find((ctx: any) =>
        ctx.id.startsWith('place.')
      );
      const countryContext = feature.context.find((ctx: any) =>
        ctx.id.startsWith('country.')
      );

      city = placeContext?.text || '';
      countryName = countryContext?.text || '';
    }

    // Fallback: use place_name if city not found
    if (!city && feature.place_type?.includes('place')) {
      city = feature.text || '';
    }

    return {
      coordinates: { lat, lng },
      city,
      country: countryName,
      formattedAddress: feature.place_name || '',
    };
  } catch (error) {
    console.error('Error geocoding zipcode:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to an address
 * @param coordinates - Latitude and longitude
 * @returns Geocoding result with address details
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<GeocodingResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
    return null;
  }

  try {
    const { lat, lng } = coordinates;

    const params = new URLSearchParams({
      access_token: token,
      types: 'postcode,place',
      limit: '1',
    });

    const url = `${MAPBOX_API_URL}/${lng},${lat}.json?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Mapbox API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn('No results found for coordinates:', coordinates);
      return null;
    }

    const feature = data.features[0];

    let city = '';
    let country = '';

    if (feature.context) {
      const placeContext = feature.context.find((ctx: any) =>
        ctx.id.startsWith('place.')
      );
      const countryContext = feature.context.find((ctx: any) =>
        ctx.id.startsWith('country.')
      );

      city = placeContext?.text || '';
      country = countryContext?.text || '';
    }

    return {
      coordinates: { lat, lng },
      city,
      country,
      formattedAddress: feature.place_name || '',
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Validate zipcode format for European countries
 * @param zipcode - The zipcode to validate
 * @param country - Optional country code for specific validation
 * @returns Whether the zipcode format is valid
 */
export function validateZipcode(zipcode: string, country?: string): boolean {
  const cleanZipcode = zipcode.trim();

  if (!cleanZipcode) {
    return false;
  }

  // Country-specific patterns
  const patterns: Record<string, RegExp> = {
    ie: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$|^D\d{2}\s?[A-Z0-9]{4}$/i, // Ireland (Eircode)
    fi: /^\d{5}$/, // Finland
    se: /^\d{3}\s?\d{2}$/, // Sweden
    no: /^\d{4}$/, // Norway
    dk: /^\d{4}$/, // Denmark
    de: /^\d{5}$/, // Germany
    fr: /^\d{5}$/, // France
    es: /^\d{5}$/, // Spain
    it: /^\d{5}$/, // Italy
    nl: /^\d{4}\s?[A-Z]{2}$/i, // Netherlands
    be: /^\d{4}$/, // Belgium
    gb: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i, // UK
  };

  if (country && patterns[country.toLowerCase()]) {
    return patterns[country.toLowerCase()].test(cleanZipcode);
  }

  // General validation: at least one letter or digit
  return /^[A-Z0-9\s-]{3,10}$/i.test(cleanZipcode);
}
