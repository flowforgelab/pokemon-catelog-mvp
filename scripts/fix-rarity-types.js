// Fix rarity types in database
const { Client } = require('pg');

async function fixRarityTypes() {
  const databaseUrl = process.argv[2] || "postgresql://postgres:rAPHDaawOtrQsQGeJMKDJEBhKRrkHJDd@switchback.proxy.rlwy.net:48285/railway";
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Drop the enum constraint and use text instead
    console.log('Updating rarity column to accept all values...');
    
    await client.query(`
      ALTER TABLE cards 
      ALTER COLUMN rarity TYPE VARCHAR(50)
    `);
    
    console.log('✅ Rarity column updated successfully!');
    console.log('You can now run the import script again.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixRarityTypes();