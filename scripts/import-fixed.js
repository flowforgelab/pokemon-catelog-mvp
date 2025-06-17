// Fixed import script for production data
const { Pool } = require('pg');
const axios = require('axios');

// Competitive card data
const competitiveCards = {
  'Charizard ex': 'competitive',
  'Pidgeot ex': 'competitive', 
  'Gardevoir ex': 'competitive',
  'Miraidon ex': 'competitive',
  'Iron Hands ex': 'competitive',
  'Lost City': 'competitive',
  'Path to the Peak': 'competitive',
  'Professor\'s Research': 'competitive',
  'Boss\'s Orders': 'competitive',
  'Ultra Ball': 'competitive',
  'Rare Candy': 'playable',
  'Switch': 'playable',
  'Iono': 'playable',
  'Arven': 'playable',
  'Super Rod': 'playable'
};

async function importFixed() {
  const databaseUrl = process.argv[2] || "postgresql://postgres:rAPHDaawOtrQsQGeJMKDJEBhKRrkHJDd@switchback.proxy.rlwy.net:48285/railway";
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected!');

    console.log('Fetching Pokemon cards...');
    const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
      params: {
        q: 'legalities.standard:legal',
        pageSize: 250,
        orderBy: '-set.releaseDate'
      }
    });

    const cards = response.data.data;
    console.log(`Fetched ${cards.length} cards`);

    // Clear existing data
    console.log('Clearing existing data...');
    await pool.query('TRUNCATE cards, card_types, attacks, abilities CASCADE');

    let imported = 0;
    let errors = 0;

    for (const card of cards) {
      try {
        // Determine competitive rating
        let rating = 'casual';
        for (const [cardName, cardRating] of Object.entries(competitiveCards)) {
          if (card.name.includes(cardName)) {
            rating = cardRating;
            break;
          }
        }

        // Insert card with proper boolean value
        await pool.query(`
          INSERT INTO cards (
            id, name, set_id, set_name, card_number, rarity, hp,
            retreat_cost, format_legal, competitive_rating, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          card.id,
          card.name,
          card.set.id,
          card.set.name,
          card.number,
          card.rarity || 'Common',
          card.hp || null,
          card.retreatCost ? card.retreatCost.length : 0,
          true, // format_legal is boolean, set to true for Standard cards
          rating,
          card.images.small
        ]);

        // Insert types
        if (card.types) {
          for (const type of card.types) {
            await pool.query(`
              INSERT INTO card_types (card_id, type)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [card.id, type.toLowerCase()]);
          }
        }

        // Insert attacks
        if (card.attacks) {
          for (let i = 0; i < card.attacks.length; i++) {
            const attack = card.attacks[i];
            await pool.query(`
              INSERT INTO attacks (card_id, name, cost, damage, text, position)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              card.id,
              attack.name,
              attack.cost ? attack.cost.join('') : '',
              attack.damage || '',
              attack.text || '',
              i
            ]);
          }
        }

        // Insert abilities
        if (card.abilities) {
          for (const ability of card.abilities) {
            await pool.query(`
              INSERT INTO abilities (card_id, name, text, type)
              VALUES ($1, $2, $3, $4)
            `, [
              card.id,
              ability.name,
              ability.text,
              ability.type || 'Ability'
            ]);
          }
        }

        imported++;
        if (imported % 50 === 0) {
          console.log(`Imported ${imported} cards...`);
        }

      } catch (err) {
        errors++;
        console.error(`Error importing ${card.name}: ${err.message}`);
      }
    }

    console.log('\n=== Import Complete ===');
    console.log(`✅ Successfully imported: ${imported} cards`);
    console.log(`❌ Errors: ${errors}`);

    // Show some sample cards
    const sampleCards = await pool.query(`
      SELECT name, rarity, competitive_rating 
      FROM cards 
      ORDER BY 
        CASE competitive_rating 
          WHEN 'competitive' THEN 1 
          WHEN 'playable' THEN 2 
          ELSE 3 
        END,
        name
      LIMIT 10
    `);

    console.log('\nSample cards in database:');
    sampleCards.rows.forEach(card => {
      console.log(`- ${card.name} (${card.rarity}) - ${card.competitive_rating}`);
    });

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

importFixed();