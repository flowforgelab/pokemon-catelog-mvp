const express = require('express');
const router = express.Router();

// Mock data for demonstration
const mockCards = [
  {
    id: "sv3-125",
    name: "Charizard ex",
    set_id: "sv3",
    set_name: "Obsidian Flames",
    card_number: "125",
    rarity: "rare_ultra",
    types: ["darkness"],
    hp: 330,
    retreat_cost: 2,
    format_legal: true,
    competitive_rating: "competitive",
    image_url: "https://images.pokemontcg.io/sv3/125.png",
    abilities: [
      {
        name: "Infernal Reign",
        text: "When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may search your deck for up to 3 Basic Fire Energy cards and attach them to your Pokémon in any way you like. Then, shuffle your deck.",
        type: "Ability"
      }
    ],
    attacks: [
      {
        name: "Burning Darkness",
        cost: ["Fire", "Fire"],
        damage: "180+",
        text: "This attack does 30 more damage for each Prize card your opponent has taken."
      }
    ]
  },
  {
    id: "sv3-164",
    name: "Pidgeot ex",
    set_id: "sv3",
    set_name: "Obsidian Flames",
    card_number: "164",
    rarity: "rare_ultra",
    types: ["colorless"],
    hp: 280,
    retreat_cost: 0,
    format_legal: true,
    competitive_rating: "competitive",
    image_url: "https://images.pokemontcg.io/sv3/164.png",
    abilities: [
      {
        name: "Quick Search",
        text: "Once during your turn, you may search your deck for a card and put it into your hand. Then, shuffle your deck. You can't use more than 1 Quick Search Ability each turn.",
        type: "Ability"
      }
    ],
    attacks: [
      {
        name: "Blustery Wind",
        cost: ["Colorless", "Colorless"],
        damage: "120",
        text: "You may discard a Stadium in play."
      }
    ]
  },
  {
    id: "sv4-70",
    name: "Iron Hands ex",
    set_id: "sv4",
    set_name: "Paradox Rift",
    card_number: "70",
    rarity: "rare_ultra",
    types: ["lightning"],
    hp: 230,
    retreat_cost: 4,
    format_legal: true,
    competitive_rating: "competitive",
    image_url: "https://images.pokemontcg.io/sv4/70.png",
    attacks: [
      {
        name: "Arm Press",
        cost: ["Lightning", "Lightning", "Colorless"],
        damage: "160",
        text: ""
      },
      {
        name: "Amp You Very Much",
        cost: ["Lightning", "Colorless", "Colorless", "Colorless"],
        damage: "120",
        text: "If your opponent's Pokémon is Knocked Out by damage from this attack, take 1 more Prize card."
      }
    ]
  }
];

// GET all cards with filtering
router.get('/', async (req, res) => {
  const { 
    type, 
    rarity, 
    search, 
    sort = 'name', 
    limit = 50,
    offset = 0 
  } = req.query;

  let filtered = [...mockCards];

  // Apply filters
  if (search) {
    filtered = filtered.filter(card => 
      card.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (type) {
    filtered = filtered.filter(card => 
      card.types.includes(type)
    );
  }

  if (rarity) {
    filtered = filtered.filter(card => card.rarity === rarity);
  }

  // Sort
  if (sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Paginate
  const total = filtered.length;
  const paginated = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json({
    cards: paginated,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// GET search endpoint (alias for root endpoint)
router.get('/search', async (req, res) => {
  const { 
    query,
    types = [],
    rarities = [],
    sets = [],
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 60
  } = req.query;

  let filtered = [...mockCards];

  // Apply search query
  if (query) {
    filtered = filtered.filter(card => 
      card.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Apply type filters
  if (types && types.length > 0) {
    const typeArray = Array.isArray(types) ? types : [types];
    filtered = filtered.filter(card => 
      card.types.some(t => typeArray.includes(t))
    );
  }

  // Apply rarity filters
  if (rarities && rarities.length > 0) {
    const rarityArray = Array.isArray(rarities) ? rarities : [rarities];
    filtered = filtered.filter(card => 
      rarityArray.includes(card.rarity)
    );
  }

  // Apply sorting
  if (sortBy === 'name') {
    filtered.sort((a, b) => 
      sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  } else if (sortBy === 'number') {
    filtered.sort((a, b) => 
      sortOrder === 'asc'
        ? parseInt(a.card_number) - parseInt(b.card_number)
        : parseInt(b.card_number) - parseInt(a.card_number)
    );
  }

  // Paginate
  const totalCount = filtered.length;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + parseInt(limit));

  res.json({
    cards: paginated.map(card => ({
      ...card,
      images: {
        small: card.image_url,
        large: card.image_url
      },
      set: {
        id: card.set_id,
        name: card.set_name,
        legalities: {
          standard: card.format_legal ? 'Legal' : 'Not Legal'
        }
      },
      competitiveRating: card.competitive_rating === 'competitive' ? 3 : 
                         card.competitive_rating === 'viable' ? 2 : 1
    })),
    totalCount,
    page: parseInt(page),
    pageSize: parseInt(limit)
  });
});

// GET single card
router.get('/:id', async (req, res) => {
  const card = mockCards.find(c => c.id === req.params.id);
  
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  res.json({
    ...card,
    related_cards: [
      { id: "sv1-198", name: "Iono", relevance_score: 5 },
      { id: "sv1-199", name: "Professor's Research", relevance_score: 4 }
    ]
  });
});

// GET filter options
router.get('/filters', async (req, res) => {
  res.json({
    types: ['grass', 'fire', 'water', 'lightning', 'psychic', 'fighting', 'darkness', 'metal', 'fairy', 'dragon', 'colorless'],
    rarities: ['common', 'uncommon', 'rare', 'rare_holo', 'rare_ultra', 'rare_secret'],
    sets: [
      { id: 'sv1', name: 'Scarlet & Violet' },
      { id: 'sv2', name: 'Paldea Evolved' },
      { id: 'sv3', name: 'Obsidian Flames' },
      { id: 'sv4', name: 'Paradox Rift' }
    ]
  });
});

// Meta endpoints
router.get('/meta/types', async (req, res) => {
  res.json([
    'grass', 'fire', 'water', 'lightning', 'psychic', 'fighting',
    'darkness', 'metal', 'fairy', 'dragon', 'colorless',
    'trainer', 'energy'
  ]);
});

router.get('/meta/rarities', async (req, res) => {
  res.json([
    'common', 'uncommon', 'rare', 'rare_holo',
    'rare_ultra', 'rare_secret', 'special_illustration_rare'
  ]);
});

router.get('/meta/sets', async (req, res) => {
  res.json([
    { set_id: 'sv1', set_name: 'Scarlet & Violet' },
    { set_id: 'sv2', set_name: 'Paldea Evolved' },
    { set_id: 'sv3', set_name: 'Obsidian Flames' },
    { set_id: 'sv4', set_name: 'Paradox Rift' }
  ]);
});

module.exports = router;