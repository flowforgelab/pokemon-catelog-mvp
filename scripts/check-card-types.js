// Check cards without types
const { Pool } = require('pg');

async function checkCardTypes() {
  const databaseUrl = "postgresql://postgres:rAPHDaawOtrQsQGeJMKDJEBhKRrkHJDd@switchback.proxy.rlwy.net:48285/railway";
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Check cards without types
    const noTypesResult = await pool.query(`
      SELECT c.id, c.name, c.rarity
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE ct.type IS NULL
      LIMIT 10
    `);
    
    console.log(`Cards without types: ${noTypesResult.rows.length}`);
    if (noTypesResult.rows.length > 0) {
      console.log('Sample cards without types:');
      noTypesResult.rows.forEach(card => {
        console.log(`- ${card.name} (${card.id})`);
      });
    }

    // Check total type entries
    const typeCountResult = await pool.query(`
      SELECT COUNT(*) FROM card_types
    `);
    console.log(`\nTotal type entries: ${typeCountResult.rows[0].count}`);

    // Check cards with types
    const withTypesResult = await pool.query(`
      SELECT COUNT(DISTINCT card_id) FROM card_types
    `);
    console.log(`Cards with types: ${withTypesResult.rows[0].count}`);

    // Check sample of cards with types
    const sampleResult = await pool.query(`
      SELECT c.name, ARRAY_AGG(ct.type) as types
      FROM cards c
      JOIN card_types ct ON c.id = ct.card_id
      GROUP BY c.id, c.name
      LIMIT 5
    `);
    
    console.log('\nSample cards with types:');
    sampleResult.rows.forEach(card => {
      console.log(`- ${card.name}: ${card.types.join(', ')}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCardTypes();