require('dotenv').config({ path: '../backend/.env' });
const axios = require('axios');
const { Pool } = require('pg');

const API_BASE = `http://localhost:${process.env.PORT || 3000}/api`;
let passedTests = 0;
let failedTests = 0;

// Test helper
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Database tests
async function testDatabase() {
  console.log('\n🗄️  DATABASE TESTS\n');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pokemon_catalog_mvp',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await test('Database connection', async () => {
    const result = await pool.query('SELECT NOW()');
    if (!result.rows[0].now) throw new Error('No timestamp returned');
  });

  await test('All tables exist', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cards', 'card_types', 'attacks', 'abilities', 'related_cards')
    `);
    if (result.rows[0].count !== '5') throw new Error(`Expected 5 tables, found ${result.rows[0].count}`);
  });

  await test('Cards table has data', async () => {
    const result = await pool.query('SELECT COUNT(*) FROM cards');
    const count = parseInt(result.rows[0].count);
    if (count < 100) throw new Error(`Expected 100+ cards, found ${count}`);
    console.log(`   → ${count} cards in database`);
  });

  await test('Card types are populated', async () => {
    const result = await pool.query('SELECT COUNT(DISTINCT type) FROM card_types');
    const count = parseInt(result.rows[0].count);
    if (count < 5) throw new Error(`Expected 5+ types, found ${count}`);
  });

  await test('Competitive cards exist', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) FROM cards 
      WHERE competitive_rating IN ('competitive', 'playable')
    `);
    const count = parseInt(result.rows[0].count);
    if (count < 10) throw new Error(`Expected 10+ competitive cards, found ${count}`);
    console.log(`   → ${count} competitive/playable cards`);
  });

  await test('Related cards are set up', async () => {
    const result = await pool.query('SELECT COUNT(*) FROM related_cards');
    const count = parseInt(result.rows[0].count);
    if (count < 5) throw new Error(`Expected 5+ related card mappings, found ${count}`);
  });

  await pool.end();
}

// API tests
async function testAPI() {
  console.log('\n🌐 API ENDPOINT TESTS\n');

  await test('Health check endpoint', async () => {
    const response = await axios.get(`${API_BASE}/health`);
    if (response.data.status !== 'OK') throw new Error('Health check failed');
  });

  await test('Get all cards', async () => {
    const response = await axios.get(`${API_BASE}/cards?limit=10`);
    if (!response.data.cards || !Array.isArray(response.data.cards)) {
      throw new Error('Invalid response format');
    }
    if (response.data.cards.length === 0) {
      throw new Error('No cards returned');
    }
    console.log(`   → Returned ${response.data.cards.length} cards`);
    console.log(`   → Total available: ${response.data.pagination.total}`);
  });

  await test('Card has required fields', async () => {
    const response = await axios.get(`${API_BASE}/cards?limit=1`);
    const card = response.data.cards[0];
    const requiredFields = ['id', 'name', 'set_id', 'card_number', 'rarity', 'image_url', 'types'];
    
    for (const field of requiredFields) {
      if (!(field in card)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log(`   → Sample card: ${card.name}`);
  });

  await test('Search functionality', async () => {
    const response = await axios.get(`${API_BASE}/cards?search=pikachu`);
    if (!response.data.cards) throw new Error('Search returned no results');
    const found = response.data.cards.some(card => 
      card.name.toLowerCase().includes('pikachu')
    );
    if (!found && response.data.cards.length > 0) {
      throw new Error('Search results do not match query');
    }
    console.log(`   → Found ${response.data.cards.length} results for "pikachu"`);
  });

  await test('Type filtering', async () => {
    const response = await axios.get(`${API_BASE}/cards?type=fire&limit=5`);
    if (response.data.cards.length > 0) {
      const allFire = response.data.cards.every(card => 
        card.types && card.types.includes('fire')
      );
      if (!allFire) throw new Error('Type filter not working correctly');
    }
    console.log(`   → Found ${response.data.pagination.total} fire-type cards`);
  });

  await test('Rarity filtering', async () => {
    const response = await axios.get(`${API_BASE}/cards?rarity=rare&limit=5`);
    if (response.data.cards.length > 0) {
      const allRare = response.data.cards.every(card => card.rarity === 'rare');
      if (!allRare) throw new Error('Rarity filter not working correctly');
    }
  });

  await test('Sorting functionality', async () => {
    const response = await axios.get(`${API_BASE}/cards?sort=name&order=ASC&limit=5`);
    const names = response.data.cards.map(c => c.name);
    const sorted = [...names].sort();
    if (JSON.stringify(names) !== JSON.stringify(sorted)) {
      throw new Error('Cards not sorted correctly');
    }
  });

  await test('Pagination', async () => {
    const page1 = await axios.get(`${API_BASE}/cards?limit=5&offset=0`);
    const page2 = await axios.get(`${API_BASE}/cards?limit=5&offset=5`);
    
    if (page1.data.cards[0].id === page2.data.cards[0].id) {
      throw new Error('Pagination not working - same results on different pages');
    }
  });

  await test('Get single card', async () => {
    const listResponse = await axios.get(`${API_BASE}/cards?limit=1`);
    const cardId = listResponse.data.cards[0].id;
    
    const response = await axios.get(`${API_BASE}/cards/${cardId}`);
    if (!response.data.id || response.data.id !== cardId) {
      throw new Error('Single card endpoint not working');
    }
    
    // Check for attacks/abilities if Pokemon
    if (response.data.types && !response.data.types.includes('trainer') && !response.data.types.includes('energy')) {
      console.log(`   → Card has ${response.data.attacks?.length || 0} attacks`);
      console.log(`   → Card has ${response.data.abilities?.length || 0} abilities`);
    }
  });

  await test('Meta endpoints - types', async () => {
    const response = await axios.get(`${API_BASE}/cards/meta/types`);
    if (!Array.isArray(response.data) || response.data.length < 10) {
      throw new Error('Types endpoint not returning expected data');
    }
    console.log(`   → ${response.data.length} types available`);
  });

  await test('Meta endpoints - rarities', async () => {
    const response = await axios.get(`${API_BASE}/cards/meta/rarities`);
    if (!Array.isArray(response.data) || response.data.length < 5) {
      throw new Error('Rarities endpoint not returning expected data');
    }
  });

  await test('Meta endpoints - sets', async () => {
    const response = await axios.get(`${API_BASE}/cards/meta/sets`);
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Sets endpoint not returning expected data');
    }
    console.log(`   → ${response.data.length} sets available`);
  });

  await test('Format legal cards only', async () => {
    const response = await axios.get(`${API_BASE}/cards?limit=20`);
    const allLegal = response.data.cards.every(card => card.format_legal === true);
    if (!allLegal) throw new Error('Non-standard cards found in results');
  });

  await test('Competitive ratings', async () => {
    const response = await axios.get(`${API_BASE}/cards?limit=100`);
    const competitiveCards = response.data.cards.filter(card => 
      card.competitive_rating === 'competitive' || card.competitive_rating === 'playable'
    );
    if (competitiveCards.length === 0) {
      throw new Error('No competitive cards found');
    }
    console.log(`   → Found ${competitiveCards.length} competitive/playable cards`);
  });
}

// Performance tests
async function testPerformance() {
  console.log('\n⚡ PERFORMANCE TESTS\n');

  await test('API response time < 3 seconds', async () => {
    const start = Date.now();
    await axios.get(`${API_BASE}/cards?limit=50`);
    const duration = Date.now() - start;
    
    if (duration > 3000) {
      throw new Error(`Response took ${duration}ms (limit: 3000ms)`);
    }
    console.log(`   → Response time: ${duration}ms`);
  });

  await test('Search response time < 3 seconds', async () => {
    const start = Date.now();
    await axios.get(`${API_BASE}/cards?search=charizard`);
    const duration = Date.now() - start;
    
    if (duration > 3000) {
      throw new Error(`Search took ${duration}ms (limit: 3000ms)`);
    }
    console.log(`   → Search time: ${duration}ms`);
  });
}

// Main test runner
async function runAllTests() {
  console.log('🧪 POKEMON CARD CATALOG MVP - STEP 1 VERIFICATION\n');
  console.log('Testing all Step 1 requirements...\n');

  try {
    // Check if server is running
    try {
      await axios.get(`${API_BASE}/health`);
    } catch (error) {
      console.error('❌ Server is not running!');
      console.error('   Please start the server first:');
      console.error('   cd ../backend && npm run dev\n');
      process.exit(1);
    }

    await testDatabase();
    await testAPI();
    await testPerformance();

    console.log('\n📊 TEST SUMMARY\n');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    if (failedTests === 0) {
      console.log('\n🎉 All Step 1 requirements verified successfully!');
      console.log('   The MVP foundation is ready for Step 2.\n');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();