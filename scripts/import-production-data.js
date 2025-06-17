// Production data import script
// Usage: node import-production-data.js "postgresql://user:pass@host:port/dbname"

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

async function importProductionData() {
  const databaseUrl = process.argv[2];
  
  if (!databaseUrl) {
    console.error('Please provide DATABASE_URL as argument');
    console.error('Usage: node import-production-data.js "postgresql://..."');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('Connected to production database!');

    console.log('Fetching Pokemon cards from API...');
    
    // Fetch recent Standard format cards
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

    // Import cards
    let imported = 0;
    let competitive = 0;
    let playable = 0;

    for (const card of cards) {
      try {
        // Determine competitive rating
        let rating = 'casual';
        if (competitiveCards[card.name] === 'competitive') {
          rating = 'competitive';
          competitive++;
        } else if (competitiveCards[card.name] === 'playable') {
          rating = 'playable';
          playable++;
        }

        // Insert card
        await pool.query(`
          INSERT INTO cards (
            id, name, set_id, set_name, card_number, rarity, hp,
            retreat_cost, format_legal, competitive_rating, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          card.id,
          card.name,
          card.set.id,
          card.set.name,
          card.number,
          card.rarity,
          card.hp || null,
          card.retreatCost ? card.retreatCost.length : 0,
          'standard',
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
          for (let i = 0; i < card.abilities.length; i++) {
            const ability = card.abilities[i];
            await pool.query(`
              INSERT INTO abilities (card_id, name, text, type, position)
              VALUES ($1, $2, $3, $4, $5)
            `, [
              card.id,
              ability.name,
              ability.text,
              ability.type,
              i
            ]);
          }
        }

        imported++;
        if (imported % 50 === 0) {
          console.log(`Imported ${imported} cards...`);
        }

      } catch (err) {
        console.error(`Error importing ${card.name}:`, err.message);
      }
    }

    console.log('\\nImport complete!');
    console.log(`Total cards imported: ${imported}`);
    console.log(`Competitive cards: ${competitive}`);
    console.log(`Playable cards: ${playable}`);
    console.log(`Casual cards: ${imported - competitive - playable}`);

    // Verify import
    const countResult = await pool.query('SELECT COUNT(*) FROM cards');
    console.log(`\\nDatabase now contains ${countResult.rows[0].count} cards`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importProductionData();