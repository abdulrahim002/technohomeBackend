/**
 * Geospatial query utilities for MongoDB
 * 
 * MongoDB GeoJSON coordinate order: [longitude, latitude]
 * This is critical - swapping these will give wrong results!
 */

/**
 * Validate and parse coordinates with explicit ordering enforcement
 * 
 * @param {string|number} lat - Latitude from client (e.g., "24.7136")
 * @param {string|number} lng - Longitude from client (e.g., "46.6753")
 * @returns {{ coordinates: [number, number], lat: number, lng: number }}
 * @throws {Error} If coordinates are invalid or out of range
 */
exports.validateAndParseCoordinates = (lat, lng) => {
  // 1. Check presence
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    throw new Error('Coordinates are required: both lat and lng must be provided');
  }

  // 2. Convert from string to number explicitly
  const parsedLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const parsedLng = typeof lng === 'string' ? parseFloat(lng) : lng;

  // 3. Validate they are valid numbers
  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    throw new Error(`Invalid coordinates: lat="${lat}", lng="${lng}" could not be parsed to numbers`);
  }

  // 4. Validate geographic bounds
  // Latitude: -90 to +90 (South Pole to North Pole)
  // Longitude: -180 to +180 (International Date Line)
  if (parsedLat < -90 || parsedLat > 90) {
    throw new Error(`Latitude out of range: ${parsedLat} (must be between -90 and 90). Did you swap lat/lng?`);
  }
  if (parsedLng < -180 || parsedLng > 180) {
    throw new Error(`Longitude out of range: ${parsedLng} (must be between -180 and 180). Did you swap lat/lng?`);
  }

  // 5. Return in correct GeoJSON order: [longitude, latitude]
  return {
    coordinates: [parsedLng, parsedLat], // IMPORTANT: MongoDB requires [lng, lat] order
    lat: parsedLat,
    lng: parsedLng
  };
};

/**
 * Helper to detect if coordinates might be accidentally swapped
 * Common mistake: client sends [lat, lng] instead of [lng, lat]
 * 
 * This function logs a warning if coordinates look suspicious
 */
exports.logCoordinateSanityCheck = (lat, lng, context = '') => {
  // Saudi Arabia bounds as example (can be adapted for other regions):
  // Lat: 16-32, Lng: 34-56
  // If lat > 90 or lng < -180, they're definitely swapped
  
  const looksSwapped = (
    (lat > 90 || lat < -90) ||  // Lat is impossible beyond ±90
    (lng > 90 && lng < 180 && lat > -90 && lat < 90)  // If "lat" looks like a longitude
  );

  if (looksSwapped) {
    console.warn(
      `[GeoQuery Sanity Check ${context}] Coordinates look swapped or invalid!`,
      `Received lat=${lat}, lng=${lng}`,
      `Expected format: lat (±90), lng (±180)`
    );
  } else {
    console.log(
      `[GeoQuery ${context}] Coordinates validated: lat=${lat}, lng=${lng} → MongoDB format: [${lng}, ${lat}]`
    );
  }
};

/**
 * Build a MongoDB $near geospatial query object
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusInKm - Search radius in kilometers
 * @returns {Object} MongoDB $near query object
 */
exports.buildGeoNearQuery = (lat, lng, radiusInKm) => {
  const { coordinates } = exports.validateAndParseCoordinates(lat, lng);
  const maxDistanceInMeters = radiusInKm * 1000;

  return {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: coordinates // [longitude, latitude]
      },
      $maxDistance: maxDistanceInMeters
    }
  };
};
