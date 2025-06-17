// Competitive Pokemon TCG Meta Data
// Based on current Standard format tournament results and expert analysis

module.exports = {
  // Top tier competitive cards - these see regular tournament play
  competitiveCards: {
    // Pokemon
    'Charizard ex': { rating: 'competitive', usage: 'high', archetype: 'attacker' },
    'Pidgeot ex': { rating: 'competitive', usage: 'high', archetype: 'support' },
    'Gardevoir ex': { rating: 'competitive', usage: 'high', archetype: 'attacker' },
    'Giratina VSTAR': { rating: 'competitive', usage: 'medium', archetype: 'attacker' },
    'Arceus VSTAR': { rating: 'competitive', usage: 'medium', archetype: 'engine' },
    'Miraidon ex': { rating: 'competitive', usage: 'high', archetype: 'attacker' },
    'Iron Hands ex': { rating: 'competitive', usage: 'medium', archetype: 'attacker' },
    'Roaring Moon ex': { rating: 'competitive', usage: 'medium', archetype: 'attacker' },
    'Chien-Pao ex': { rating: 'competitive', usage: 'medium', archetype: 'attacker' },
    'Snorlax': { rating: 'competitive', usage: 'high', archetype: 'stall' },
    
    // Trainers
    'Iono': { rating: 'competitive', usage: 'very-high', archetype: 'disruption' },
    'Professor\'s Research': { rating: 'competitive', usage: 'very-high', archetype: 'draw' },
    'Boss\'s Orders': { rating: 'competitive', usage: 'very-high', archetype: 'gust' },
    'Lost City': { rating: 'competitive', usage: 'high', archetype: 'stadium' },
    'Path to the Peak': { rating: 'competitive', usage: 'high', archetype: 'stadium' },
    'Collapsed Stadium': { rating: 'competitive', usage: 'medium', archetype: 'stadium' },
    'Ultra Ball': { rating: 'competitive', usage: 'very-high', archetype: 'search' },
    'Nest Ball': { rating: 'competitive', usage: 'high', archetype: 'search' },
    'Battle VIP Pass': { rating: 'competitive', usage: 'high', archetype: 'setup' },
    'Super Rod': { rating: 'competitive', usage: 'high', archetype: 'recovery' },
  },

  // Playable cards - good options but not top tier
  playableCards: {
    // Pokemon
    'Bibarel': { rating: 'playable', usage: 'high', archetype: 'draw-engine' },
    'Radiant Greninja': { rating: 'playable', usage: 'medium', archetype: 'draw-engine' },
    'Lumineon V': { rating: 'playable', usage: 'medium', archetype: 'draw-engine' },
    'Manaphy': { rating: 'playable', usage: 'medium', archetype: 'bench-protection' },
    'Spiritomb': { rating: 'playable', usage: 'medium', archetype: 'ability-lock' },
    'Drapion V': { rating: 'playable', usage: 'low', archetype: 'tech-attacker' },
    'Hawlucha': { rating: 'playable', usage: 'low', archetype: 'tech-attacker' },
    'Radiant Charizard': { rating: 'playable', usage: 'low', archetype: 'attacker' },
    'Klefki': { rating: 'playable', usage: 'medium', archetype: 'ability-protection' },
    'Jirachi': { rating: 'playable', usage: 'low', archetype: 'support' },
    
    // Trainers
    'Quick Ball': { rating: 'playable', usage: 'high', archetype: 'search' },
    'Level Ball': { rating: 'playable', usage: 'medium', archetype: 'search' },
    'Fog Crystal': { rating: 'playable', usage: 'medium', archetype: 'search' },
    'Cross Switcher': { rating: 'playable', usage: 'medium', archetype: 'switch' },
    'Switch Cart': { rating: 'playable', usage: 'medium', archetype: 'switch' },
    'Artazon': { rating: 'playable', usage: 'medium', archetype: 'stadium' },
    'Beach Court': { rating: 'playable', usage: 'low', archetype: 'stadium' },
    'Judge': { rating: 'playable', usage: 'medium', archetype: 'disruption' },
    'Roxanne': { rating: 'playable', usage: 'low', archetype: 'disruption' },
    'Arven': { rating: 'playable', usage: 'high', archetype: 'search' },
  },

  // Card relationships - what cards work well together
  cardSynergies: {
    // Charizard ex deck core
    'Charizard ex': [
      'Pidgeot ex',
      'Rare Candy',
      'Arcanine ex',
      'Charmeleon',
      'Charmander',
      'Iono',
      'Professor\'s Research',
      'Boss\'s Orders',
      'Ultra Ball',
      'Super Rod'
    ],
    
    // Pidgeot ex (general support)
    'Pidgeot ex': [
      'Rare Candy',
      'Pidgey',
      'Ultra Ball',
      'Iono',
      'Boss\'s Orders',
      'Charizard ex',
      'Gardevoir ex',
      'Technical Machine: Devolution'
    ],
    
    // Gardevoir ex deck core
    'Gardevoir ex': [
      'Kirlia',
      'Ralts',
      'Rare Candy',
      'Fog Crystal',
      'Zacian V',
      'Scream Tail',
      'Professor\'s Research',
      'Iono',
      'Moonlit Hill',
      'Super Rod'
    ],
    
    // Lost Box engine
    'Comfey': [
      'Colress\'s Experiment',
      'Lost City',
      'Mirage Gate',
      'Sableye',
      'Radiant Greninja',
      'Lost Vacuum',
      'Cross Switcher',
      'Cramorant',
      'Switch Cart'
    ],
    
    // Miraidon ex deck
    'Miraidon ex': [
      'Flaaffy',
      'Mareep',
      'Raikou V',
      'Iron Hands ex',
      'Electric Generator',
      'Professor\'s Research',
      'Iono',
      'Beach Court',
      'Forest Seal Stone'
    ],
    
    // Draw engines
    'Bibarel': [
      'Bidoof',
      'Ultra Ball',
      'Quick Ball',
      'Professor\'s Research',
      'Skwovet',
      'Twin Energy'
    ],
    
    'Radiant Greninja': [
      'Energy Retrieval',
      'Fog Crystal',
      'Battle VIP Pass',
      'Melony',
      'Irida'
    ],
    
    // Trainer synergies
    'Iono': [
      'Judge',
      'Roxanne',
      'Path to the Peak',
      'Spiritomb'
    ],
    
    'Professor\'s Research': [
      'Ultra Ball',
      'Quick Ball',
      'Battle VIP Pass',
      'Super Rod'
    ],
    
    'Boss\'s Orders': [
      'Cross Switcher',
      'Escape Rope',
      'Switch Cart',
      'Counter Catcher'
    ],
    
    // Stadium synergies
    'Lost City': [
      'Lost Vacuum',
      'Comfey',
      'Sableye',
      'Colress\'s Experiment'
    ],
    
    'Path to the Peak': [
      'Spiritomb',
      'Iono',
      'Judge',
      'Klefki'
    ],
    
    // Energy acceleration
    'Dark Patch': [
      'Galarian Moltres V',
      'Darkrai VSTAR',
      'Dark Energy',
      'Energy Switch'
    ],
    
    'Mirage Gate': [
      'Comfey',
      'Sableye',
      'Cramorant',
      'Lost City'
    ],
    
    // Search cards
    'Ultra Ball': [
      'Professor\'s Research',
      'Quick Ball',
      'Nest Ball',
      'Level Ball'
    ],
    
    'Battle VIP Pass': [
      'Lumineon V',
      'Professor\'s Research',
      'Ultra Ball',
      'Arven'
    ],
    
    // Recovery
    'Super Rod': [
      'Professor\'s Research',
      'Lost Vacuum',
      'Ordinary Rod',
      'Energy Retrieval'
    ],
    
    // Special combos
    'Rare Candy': [
      'Pidgeot ex',
      'Charizard ex',
      'Gardevoir ex',
      'Alakazam ex',
      'Ultra Ball'
    ],
    
    'Arven': [
      'Battle VIP Pass',
      'Rare Candy',
      'Forest Seal Stone',
      'Choice Belt',
      'Nest Ball'
    ]
  },

  // Deck archetypes and their core cards
  deckArchetypes: {
    'Charizard ex': {
      core: ['Charizard ex', 'Pidgeot ex', 'Rare Candy'],
      support: ['Arcanine ex', 'Bibarel', 'Iono', 'Professor\'s Research'],
      tech: ['Lumineon V', 'Manaphy', 'Lost Vacuum']
    },
    
    'Gardevoir ex': {
      core: ['Gardevoir ex', 'Kirlia', 'Fog Crystal'],
      support: ['Zacian V', 'Scream Tail', 'Moonlit Hill'],
      tech: ['Pidgeot ex', 'Jirachi', 'Technical Machine: Devolution']
    },
    
    'Lost Box': {
      core: ['Comfey', 'Sableye', 'Lost City', 'Mirage Gate'],
      support: ['Cramorant', 'Radiant Greninja', 'Colress\'s Experiment'],
      tech: ['Spiritomb', 'Klefki', 'Lost Vacuum']
    },
    
    'Miraidon ex': {
      core: ['Miraidon ex', 'Flaaffy', 'Electric Generator'],
      support: ['Raikou V', 'Iron Hands ex', 'Beach Court'],
      tech: ['Forest Seal Stone', 'Spiritomb', 'Path to the Peak']
    }
  }
};