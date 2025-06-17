// Test backend API endpoints
const axios = require('axios');

const API_URL = process.argv[2] || 'https://pokemon-catelog-mvp-production.up.railway.app';

async function testAPI() {
  console.log('Testing API at:', API_URL);
  console.log('-------------------\n');

  // Test health endpoint
  try {
    console.log('1. Testing /api/health...');
    const health = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check:', health.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }

  console.log('\n');

  // Test cards search
  try {
    console.log('2. Testing /api/cards/search...');
    const cards = await axios.get(`${API_URL}/api/cards/search?limit=5`);
    console.log('✅ Cards found:', cards.data.cards.length);
    console.log('   Total in DB:', cards.data.totalCount);
    console.log('   First card:', cards.data.cards[0]?.name);
  } catch (error) {
    console.log('❌ Cards search failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }

  console.log('\n');

  // Test filters endpoint
  try {
    console.log('3. Testing /api/cards/filters...');
    const filters = await axios.get(`${API_URL}/api/cards/filters`);
    console.log('✅ Filters loaded');
    console.log('   Types:', filters.data.types?.length || 0);
    console.log('   Rarities:', filters.data.rarities?.length || 0);
    console.log('   Sets:', filters.data.sets?.length || 0);
  } catch (error) {
    console.log('❌ Filters failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
    }
  }

  console.log('\n');

  // Try root endpoint
  try {
    console.log('4. Testing root /...');
    const root = await axios.get(`${API_URL}/`);
    console.log('✅ Root response received');
  } catch (error) {
    console.log('❌ Root failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
    }
  }
}

testAPI().catch(console.error);