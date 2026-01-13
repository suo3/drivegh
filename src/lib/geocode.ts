/**
 * Geocode an address string to lat/lng coordinates using Nominatim (OpenStreetMap)
 * @param address The address string to geocode
 * @returns Promise with lat/lng or null if not found
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) {
    return null;
  }

  try {
    // Add Ghana as context for better results
    const searchQuery = address.toLowerCase().includes('ghana') 
      ? address 
      : `${address}, Ghana`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
      { 
        headers: { 
          'User-Agent': 'RoadsideAssistance/1.0',
          'Accept': 'application/json'
        } 
      }
    );

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
