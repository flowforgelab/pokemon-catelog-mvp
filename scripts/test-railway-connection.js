// Test Railway PostgreSQL connection
const { Client } = require('pg');

async function testConnection() {
  const databaseUrl = process.argv[2] || "postgresql://postgres:rAPHDaawOtrQsQGeJMKDJEBhKRrkHJDd@switchback.proxy.rlwy.net:48285/railway";
  
  console.log('Testing Railway PostgreSQL connection...');
  console.log('Host:', databaseUrl.split('@')[1].split(':')[0]);
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nExisting tables:');
    if (tables.rows.length === 0) {
      console.log('  No tables found - database is empty');
    } else {
      tables.rows.forEach(row => {
        console.log('  -', row.table_name);
      });
    }
    
    console.log('\n✅ Connection test successful!');
    console.log('You can now run the setup and import scripts.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if the DATABASE_URL is correct');
    console.error('2. Make sure PostgreSQL is added to your Railway project');
    console.error('3. Verify the database is active in Railway dashboard');
  } finally {
    await client.end();
  }
}

testConnection();