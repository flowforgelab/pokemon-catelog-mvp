const pokemonTcgApi = require('../backend/services/pokemonTcgApi');

async function getExactCardData() {
  try {
    console.log('Fetching exact card data for our 3 cards...\n');
    
    const cardIds = [
      'sv3-125',  // Charizard ex
      'sv3-164',  // Pidgeot ex  
      'sv4-70'    // Iron Hands ex
    ];
    
    for (const id of cardIds) {
      const response = await pokemonTcgApi.getCard(id);
      const card = response.data;
      
      console.log(`\n${card.name} (${card.id})`);
      console.log('='.repeat(40));
      
      if (card.abilities && card.abilities.length > 0) {
        console.log('Abilities:');
        card.abilities.forEach(ability => {
          console.log(`  - ${ability.name}: ${ability.text}`);
        });
      }
      
      if (card.attacks && card.attacks.length > 0) {
        console.log('Attacks:');
        card.attacks.forEach(attack => {
          console.log(`  - ${attack.name} (${attack.cost.join('')}): ${attack.damage || '-'}`);
          if (attack.text) console.log(`    ${attack.text}`);
        });
      }
      
      console.log(`HP: ${card.hp}`);
      console.log(`Retreat Cost: ${card.retreatCost?.length || 0}`);
      console.log(`Types: ${card.types?.join(', ') || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getExactCardData();