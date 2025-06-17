// Script to set up production database
// Usage: node setup-production-db.js "postgresql://user:pass@host:port/dbname"

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function setupProductionDB() {
  const databaseUrl = process.argv[2];
  
  if (!databaseUrl) {
    console.error('Please provide DATABASE_URL as argument');
    console.error('Usage: node setup-production-db.js "postgresql://..."');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to production database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    console.log('Creating tables...');
    await client.query(schema);
    console.log('Database schema created successfully!');

    // Test the setup
    const result = await client.query('SELECT COUNT(*) FROM cards');
    console.log(`Cards table created. Current count: ${result.rows[0].count}`);

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupProductionDB();