const axios = require('axios');

class PokemonTCGAPI {
  constructor() {
    this.baseURL = process.env.POKEMON_TCG_API_URL || 'https://api.pokemontcg.io/v2';
    this.apiKey = process.env.POKEMON_TCG_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-Api-Key': this.apiKey })
      },
      timeout: 10000
    });
  }

  async getCards(params = {}) {
    try {
      const response = await this.client.get('/cards', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching cards from Pokemon TCG API:', error.message);
      throw error;
    }
  }

  async getCard(id) {
    try {
      const response = await this.client.get(`/cards/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card ${id}:`, error.message);
      throw error;
    }
  }

  async getSets(params = {}) {
    try {
      const response = await this.client.get('/sets', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sets:', error.message);
      throw error;
    }
  }

  async getStandardFormatCards() {
    try {
      // Get Standard format sets (Scarlet & Violet era)
      // These are the current Standard legal sets as of 2024
      const standardSets = [
        'sv1', 'sv2', 'sv3', 'sv3pt5', 'sv4', 'sv4pt5', 'sv5', 'sv6',
        'svp', 'sv7', 'sv8', // Base SV sets
        'cel25c', // Celebrations subset
        'pgo', // Pokemon GO subset that's still Standard legal
      ];

      const allCards = [];
      
      for (const setId of standardSets) {
        console.log(`Fetching cards from set: ${setId}`);
        
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const response = await this.getCards({
            q: `set.id:${setId}`,
            page: page,
            pageSize: 250 // Max allowed by API
          });
          
          allCards.push(...response.data);
          
          hasMore = response.page < response.totalPages;
          page++;
          
          // Rate limiting - be nice to the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Total Standard format cards fetched: ${allCards.length}`);
      return allCards;
    } catch (error) {
      console.error('Error fetching Standard format cards:', error);
      throw error;
    }
  }

  // Helper method to transform API data to our schema
  transformCardData(apiCard) {
    // Map Pokemon TCG API types to our types
    const typeMapping = {
      'Grass': 'grass',
      'Fire': 'fire',
      'Water': 'water',
      'Lightning': 'lightning',
      'Psychic': 'psychic',
      'Fighting': 'fighting',
      'Darkness': 'darkness',
      'Metal': 'metal',
      'Fairy': 'fairy',
      'Dragon': 'dragon',
      'Colorless': 'colorless'
    };

    // Map rarity
    const rarityMapping = {
      'Common': 'common',
      'Uncommon': 'uncommon',
      'Rare': 'rare',
      'Rare Holo': 'rare_holo',
      'Rare Ultra': 'rare_ultra',
      'Rare Secret': 'rare_secret',
      'Rare Shiny': 'rare_shiny',
      'Amazing Rare': 'amazing_rare',
      'Radiant Rare': 'radiant_rare',
      'Special Illustration Rare': 'special_illustration_rare'
    };

    const types = apiCard.types?.map(t => typeMapping[t]).filter(Boolean) || [];
    if (apiCard.supertype === 'Trainer') types.push('trainer');
    if (apiCard.supertype === 'Energy') types.push('energy');

    return {
      id: apiCard.id,
      name: apiCard.name,
      set_id: apiCard.set.id,
      set_name: apiCard.set.name,
      card_number: apiCard.number,
      rarity: rarityMapping[apiCard.rarity] || 'common',
      hp: apiCard.hp ? parseInt(apiCard.hp) : null,
      retreat_cost: apiCard.retreatCost?.length || 0,
      format_legal: true, // We're only importing Standard cards
      competitive_rating: 'casual', // Default, will be updated manually
      image_url: apiCard.images.large || apiCard.images.small,
      types: types,
      attacks: apiCard.attacks?.map((attack, index) => ({
        name: attack.name,
        cost: attack.cost?.join('') || '',
        damage: attack.damage || '',
        text: attack.text || '',
        position: index
      })) || [],
      abilities: apiCard.abilities?.map(ability => ({
        name: ability.name,
        text: ability.text,
        type: ability.type || 'Ability'
      })) || []
    };
  }
}

module.exports = new PokemonTCGAPI();