// Fix trainer cards to have proper type
const { Pool } = require('pg');

async function fixTrainerCards() {
  const databaseUrl = "postgresql://postgres:rAPHDaawOtrQsQGeJMKDJEBhKRrkHJDd@switchback.proxy.rlwy.net:48285/railway";
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Finding cards without types...');
    
    // Get all cards without types (likely trainers/items/stadiums)
    const noTypesResult = await pool.query(`
      SELECT c.id, c.name
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE ct.type IS NULL
    `);
    
    console.log(`Found ${noTypesResult.rows.length} cards without types`);
    
    // Add 'trainer' type to these cards
    let fixed = 0;
    for (const card of noTypesResult.rows) {
      try {
        await pool.query(`
          INSERT INTO card_types (card_id, type)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [card.id, 'trainer']);
        fixed++;
        
        if (fixed % 10 === 0) {
          console.log(`Fixed ${fixed} cards...`);
        }
      } catch (err) {
        console.error(`Error fixing ${card.name}:`, err.message);
      }
    }
    
    console.log(`\nFixed ${fixed} trainer cards`);
    
    // Verify the fix
    const checkResult = await pool.query(`
      SELECT COUNT(*) as total_cards,
             COUNT(DISTINCT ct.card_id) as cards_with_types
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
    `);
    
    const stats = checkResult.rows[0];
    console.log(`\nDatabase status:`);
    console.log(`Total cards: ${stats.total_cards}`);
    console.log(`Cards with types: ${stats.cards_with_types}`);
    console.log(`Cards without types: ${stats.total_cards - stats.cards_with_types}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixTrainerCards();