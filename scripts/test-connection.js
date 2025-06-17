require('dotenv').config({ path: '../backend/.env' });
const axios = require('axios');
const { Pool } = require('pg');

// Test Pokemon TCG API connection
async function testPokemonAPI() {
  console.log('Testing Pokemon TCG API connection...');
  
  try {
    const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
      params: { pageSize: 1 },
      headers: process.env.POKEMON_TCG_API_KEY ? {
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY
      } : {}
    });
    
    console.log('✓ Pokemon TCG API connection successful');
    console.log(`  API Version: v2`);
    console.log(`  Total cards available: ${response.data.totalCount}`);
    console.log(`  Sample card: ${response.data.data[0].name}`);
    return true;
  } catch (error) {
    console.error('✗ Pokemon TCG API connection failed:', error.message);
    return false;
  }
}

// Test database connection
async function testDatabase() {
  console.log('\nTesting PostgreSQL database connection...');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pokemon_catalog_mvp',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');
    console.log(`  Current time: ${result.rows[0].now}`);
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cards', 'card_types', 'attacks', 'abilities', 'related_cards')
      ORDER BY table_name
    `);
    
    console.log(`  Tables found: ${tablesResult.rows.length}/5`);
    tablesResult.rows.forEach(row => {
      console.log(`    - ${row.table_name}`);
    });
    
    if (tablesResult.rows.length === 5) {
      // Check card count
      const countResult = await pool.query('SELECT COUNT(*) FROM cards');
      console.log(`  Cards in database: ${countResult.rows[0].count}`);
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    await pool.end();
    return false;
  }
}

// Test Express server
async function testServer() {
  console.log('\nTesting Express server...');
  
  const serverUrl = `http://localhost:${process.env.PORT || 3000}`;
  
  try {
    const response = await axios.get(`${serverUrl}/api/health`);
    console.log('✓ Express server is running');
    console.log(`  Status: ${response.data.status}`);
    console.log(`  URL: ${serverUrl}`);
    
    // Test cards endpoint
    try {
      const cardsResponse = await axios.get(`${serverUrl}/api/cards?limit=1`);
      console.log('✓ Cards API endpoint working');
      console.log(`  Total cards available: ${cardsResponse.data.pagination.total}`);
    } catch (error) {
      console.log('✗ Cards API endpoint not responding');
    }
    
    return true;
  } catch (error) {
    console.error('✗ Express server not running');
    console.log('  Make sure to start the server with: npm run dev');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Pokemon Card Catalog MVP - Connection Tests\n');
  
  const apiTest = await testPokemonAPI();
  const dbTest = await testDatabase();
  const serverTest = await testServer();
  
  console.log('\n=== Summary ===');
  console.log(`Pokemon TCG API: ${apiTest ? '✓ Connected' : '✗ Failed'}`);
  console.log(`PostgreSQL Database: ${dbTest ? '✓ Connected' : '✗ Failed'}`);
  console.log(`Express Server: ${serverTest ? '✓ Running' : '✗ Not Running'}`);
  
  if (!dbTest) {
    console.log('\nTo set up the database:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Create database: createdb pokemon_catalog_mvp');
    console.log('3. Run schema: psql pokemon_catalog_mvp < ../database/schema.sql');
  }
  
  if (!serverTest) {
    console.log('\nTo start the server:');
    console.log('1. cd ../backend');
    console.log('2. npm install');
    console.log('3. npm run dev');
  }
}

runTests();