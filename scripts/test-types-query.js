// Test types query
const { Pool } = require('pg');

async function testTypesQuery() {
  const databaseUrl = "postgresql://postgres:rAPHDaawOtrQsQGeJMKDJEBhKRrkHJDd@switchback.proxy.rlwy.net:48285/railway";
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing types query...\n');
    
    // Test the query that's being used
    const result = await pool.query(`
      SELECT DISTINCT c.id, c.name, 
        ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE c.format_legal = true
      GROUP BY c.id, c.name
      LIMIT 5
    `);
    
    console.log('Raw query results:');
    result.rows.forEach(row => {
      console.log(`${row.name}:`);
      console.log(`  types raw:`, row.types);
      console.log(`  types type:`, typeof row.types);
      console.log(`  is array:`, Array.isArray(row.types));
      console.log('');
    });

    // Test with explicit array conversion
    const result2 = await pool.query(`
      SELECT c.id, c.name,
        COALESCE(
          json_agg(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL),
          '[]'::json
        ) as types
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE c.format_legal = true
      GROUP BY c.id, c.name
      LIMIT 5
    `);
    
    console.log('\nWith JSON aggregation:');
    result2.rows.forEach(row => {
      console.log(`${row.name}: ${JSON.stringify(row.types)}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testTypesQuery();