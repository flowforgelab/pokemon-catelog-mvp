require('dotenv').config({ path: '../backend/.env' });
const { Pool } = require('pg');
const pokemonTcgApi = require('../backend/services/pokemonTcgApi');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pokemon_catalog_mvp',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Import competitive meta data
const competitiveMeta = require('../backend/data/competitive-meta');

// Extract card names for rating assignment
const competitiveCardNames = Object.keys(competitiveMeta.competitiveCards);
const playableCardNames = Object.keys(competitiveMeta.playableCards);

// Use the comprehensive synergies from meta data
const relatedCardsMap = competitiveMeta.cardSynergies;

async function importCards() {
  try {
    console.log('Starting card import process...');
    
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Fetch Standard format cards
    console.log('Fetching Standard format cards from Pokemon TCG API...');
    const cards = await pokemonTcgApi.getStandardFormatCards();
    console.log(`Fetched ${cards.length} cards`);

    // Clear existing data
    console.log('Clearing existing data...');
    await pool.query('TRUNCATE cards, card_types, attacks, abilities, related_cards CASCADE');

    // Import cards
    let importedCount = 0;
    const errors = [];

    for (const apiCard of cards) {
      try {
        const cardData = pokemonTcgApi.transformCardData(apiCard);
        
        // Determine competitive rating with exact matching
        if (competitiveCardNames.some(name => cardData.name === name || cardData.name.includes(name))) {
          cardData.competitive_rating = 'competitive';
        } else if (playableCardNames.some(name => cardData.name === name || cardData.name.includes(name))) {
          cardData.competitive_rating = 'playable';
        }

        // Insert card
        const cardResult = await pool.query(`
          INSERT INTO cards (
            id, name, set_id, set_name, card_number, rarity, hp,
            retreat_cost, format_legal, competitive_rating, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            competitive_rating = EXCLUDED.competitive_rating,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          cardData.id,
          cardData.name,
          cardData.set_id,
          cardData.set_name,
          cardData.card_number,
          cardData.rarity,
          cardData.hp,
          cardData.retreat_cost,
          cardData.format_legal,
          cardData.competitive_rating,
          cardData.image_url
        ]);

        // Insert types
        for (const type of cardData.types) {
          await pool.query(`
            INSERT INTO card_types (card_id, type)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [cardData.id, type]);
        }

        // Insert attacks
        for (const attack of cardData.attacks) {
          await pool.query(`
            INSERT INTO attacks (card_id, name, cost, damage, text, position)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            cardData.id,
            attack.name,
            attack.cost,
            attack.damage,
            attack.text,
            attack.position
          ]);
        }

        // Insert abilities
        for (const ability of cardData.abilities) {
          await pool.query(`
            INSERT INTO abilities (card_id, name, text, type)
            VALUES ($1, $2, $3, $4)
          `, [
            cardData.id,
            ability.name,
            ability.text,
            ability.type
          ]);
        }

        importedCount++;
        
        if (importedCount % 50 === 0) {
          console.log(`Imported ${importedCount} cards...`);
        }
      } catch (error) {
        errors.push({ card: apiCard.name, error: error.message });
        console.error(`Error importing card ${apiCard.name}:`, error.message);
      }
    }

    // Import related cards for top competitive cards
    console.log('Setting up related cards...');
    for (const [cardName, relatedNames] of Object.entries(relatedCardsMap)) {
      try {
        // Find card ID by name
        const cardResult = await pool.query(
          'SELECT id FROM cards WHERE name ILIKE $1 LIMIT 1',
          [`%${cardName}%`]
        );
        
        if (cardResult.rows.length > 0) {
          const cardId = cardResult.rows[0].id;
          
          for (const relatedName of relatedNames) {
            const relatedResult = await pool.query(
              'SELECT id FROM cards WHERE name ILIKE $1 LIMIT 1',
              [`%${relatedName}%`]
            );
            
            if (relatedResult.rows.length > 0) {
              await pool.query(`
                INSERT INTO related_cards (card_id, related_card_id, relevance_score)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING
              `, [cardId, relatedResult.rows[0].id, 5]);
            }
          }
        }
      } catch (error) {
        console.error(`Error setting up related cards for ${cardName}:`, error.message);
      }
    }

    console.log(`\nImport completed!`);
    console.log(`Total cards imported: ${importedCount}`);
    console.log(`Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(e => console.log(`- ${e.card}: ${e.error}`));
    }

    // Verify import
    const countResult = await pool.query('SELECT COUNT(*) FROM cards');
    console.log(`\nCards in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('Fatal error during import:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run import
importCards();