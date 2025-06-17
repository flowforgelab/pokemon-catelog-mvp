const pokemonTcgApi = require('../backend/services/pokemonTcgApi');

async function getSpecificCards() {
  try {
    console.log('Fetching specific cards from Pokemon TCG API...\n');
    
    // Let's get 3 popular competitive cards from recent sets
    const cardIds = [
      'sv7-54',   // Should be Charizard ex from Stellar Crown
      'sv6-88',   // Should be Gardevoir ex from Twilight Masquerade  
      'sv3pt5-64' // Should be Iono from 151
    ];
    
    const cards = [];
    
    for (const id of cardIds) {
      console.log(`Fetching card ${id}...`);
      try {
        const response = await pokemonTcgApi.getCard(id);
        const card = response.data;
        
        console.log(`✓ Found: ${card.name}`);
        console.log(`  Set: ${card.set.name}`);
        console.log(`  ID: ${card.id}`);
        console.log(`  Rarity: ${card.rarity}`);
        console.log(`  Types: ${card.types?.join(', ') || card.supertype}`);
        console.log(`  HP: ${card.hp || 'N/A'}`);
        console.log(`  Image URL: ${card.images.large}`);
        console.log(`  Small Image: ${card.images.small}`);
        
        cards.push({
          id: card.id,
          name: card.name,
          set_name: card.set.name,
          image_large: card.images.large,
          image_small: card.images.small,
          types: card.types || [card.supertype],
          hp: card.hp,
          attacks: card.attacks,
          rarity: card.rarity
        });
        
        console.log('');
      } catch (error) {
        console.log(`✗ Error fetching ${id}: ${error.message}\n`);
      }
    }
    
    // Let's also search for some specific popular cards
    console.log('Searching for popular competitive cards...\n');
    
    const searches = [
      { name: 'Charizard ex', set: 'sv3' },  // Obsidian Flames
      { name: 'Pidgeot ex', set: 'sv3' },    // Obsidian Flames
      { name: 'Iron Hands ex', set: 'sv4' }  // Paradox Rift
    ];
    
    for (const search of searches) {
      const response = await pokemonTcgApi.getCards({
        q: `name:"${search.name}" set.id:${search.set}`,
        pageSize: 1
      });
      
      if (response.data.length > 0) {
        const card = response.data[0];
        console.log(`Found: ${card.name} (${card.id})`);
        console.log(`  Image: ${card.images.large}`);
        console.log('');
      }
    }
    
    console.log('\nGenerating mock data format...\n');
    console.log(JSON.stringify(cards, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getSpecificCards();