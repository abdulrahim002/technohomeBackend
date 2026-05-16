const axios = require('axios');

const test = async () => {
  try {
    console.log('Fetching from API...');
    const res = await axios.get('http://localhost:5000/api/service-requests/lookups/cities');
    console.log('Status:', res.status);
    const cities = res.data.data.cities;
    console.log(`Total cities: ${cities.length}`);
    const tripoli = cities.find(c => c.id === 'tripoli');
    if (tripoli) {
      console.log('Tripoli areas:', tripoli.areas ? tripoli.areas.length : 'MISSING');
    } else {
      console.log('Tripoli not found by ID, searching by name...');
      const tripoliByName = cities.find(c => c.nameAr === 'طرابلس');
      console.log('Tripoli (by name) areas:', tripoliByName && tripoliByName.areas ? tripoliByName.areas.length : 'MISSING');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
};

test();
