const pokemonTcgApi = require('../backend/services/pokemonTcgApi');

async function testAPI() {
  try {
    console.log('Testing Pokemon TCG API...\n');
    
    // Test 1: Get a specific Charizard card
    console.log('1. Fetching Charizard cards...');
    const charizardCards = await pokemonTcgApi.getCards({
      q: 'name:charizard',
      pageSize: 5
    });
    
    console.log(`Found ${charizardCards.data.length} Charizard cards`);
    if (charizardCards.data.length > 0) {
      const card = charizardCards.data[0];
      console.log(`- ${card.name} from ${card.set.name}`);
      console.log(`  ID: ${card.id}`);
      console.log(`  Image: ${card.images.small}`);
    }
    
    // Test 2: Get Standard format cards
    console.log('\n2. Fetching some Standard format cards...');
    const standardCards = await pokemonTcgApi.getCards({
      q: 'set.id:sv7', // Stellar Crown set
      pageSize: 3
    });
    
    console.log(`Found ${standardCards.data.length} cards from Stellar Crown`);
    standardCards.data.forEach(card => {
      console.log(`- ${card.name} (${card.id})`);
      console.log(`  Image: ${card.images.small}`);
    });
    
    console.log('\n✅ Pokemon TCG API is working!');
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

testAPI();