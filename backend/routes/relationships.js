const express = require('express');
const router = express.Router();
const db = require('../config/database');
const competitiveMeta = require('../data/competitive-meta');

// GET /api/relationships/:cardName - Get related cards for deck building
router.get('/:cardName', async (req, res) => {
  try {
    const { cardName } = req.params;
    const decodedName = decodeURIComponent(cardName);

    // First check if we have curated relationships
    const curatedRelations = competitiveMeta.cardSynergies[decodedName];
    
    if (curatedRelations && curatedRelations.length > 0) {
      // Get card details for the related cards
      const placeholders = curatedRelations.map((_, i) => `$${i + 1}`).join(',');
      const query = `
        SELECT 
          c.id,
          c.name,
          c.set_name,
          c.card_number,
          c.image_url,
          c.competitive_rating,
          c.rarity,
          ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types
        FROM cards c
        LEFT JOIN card_types ct ON c.id = ct.card_id
        WHERE c.name = ANY($1::text[])
          AND c.format_legal = true
        GROUP BY c.id
        ORDER BY 
          CASE c.competitive_rating
            WHEN 'competitive' THEN 1
            WHEN 'playable' THEN 2
            ELSE 3
          END,
          c.name
      `;

      const result = await db.query(query, [curatedRelations]);
      
      // Add relevance scores based on position in curated list
      const relatedCards = result.rows.map((card, index) => ({
        ...card,
        relevance_score: 10 - Math.floor(index / 2),
        relationship_type: determineRelationshipType(decodedName, card.name, card.types)
      }));

      return res.json({
        card_name: decodedName,
        related_cards: relatedCards,
        deck_archetype: findDeckArchetype(decodedName),
        source: 'curated'
      });
    }

    // Fallback: Find related cards based on database relationships
    const dbQuery = `
      SELECT 
        c.id,
        c.name,
        c.set_name,
        c.card_number,
        c.image_url,
        c.competitive_rating,
        c.rarity,
        rc.relevance_score,
        ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types
      FROM cards source
      JOIN related_cards rc ON source.id = rc.card_id
      JOIN cards c ON rc.related_card_id = c.id
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE source.name ILIKE $1
        AND c.format_legal = true
      GROUP BY c.id, rc.relevance_score
      ORDER BY rc.relevance_score DESC, c.name
      LIMIT 20
    `;

    const dbResult = await db.query(dbQuery, [`%${decodedName}%`]);

    if (dbResult.rows.length > 0) {
      const relatedCards = dbResult.rows.map(card => ({
        ...card,
        relationship_type: determineRelationshipType(decodedName, card.name, card.types)
      }));

      return res.json({
        card_name: decodedName,
        related_cards: relatedCards,
        deck_archetype: findDeckArchetype(decodedName),
        source: 'database'
      });
    }

    // No relationships found
    res.json({
      card_name: decodedName,
      related_cards: [],
      deck_archetype: null,
      source: 'none',
      message: 'No specific relationships found for this card'
    });

  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch card relationships' });
  }
});

// GET /api/relationships/suggest/:cardId - Suggest cards to add to deck
router.get('/suggest/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { 
      existing_cards = [], // Array of card names already in deck
      deck_size = 0 
    } = req.query;

    // Get the card details
    const cardQuery = `
      SELECT c.name, c.competitive_rating,
        ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const cardResult = await db.query(cardQuery, [cardId]);
    
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const card = cardResult.rows[0];
    const suggestions = [];

    // Check if this card is part of a known archetype
    const archetype = findDeckArchetype(card.name);
    
    if (archetype) {
      const archetypeData = competitiveMeta.deckArchetypes[archetype];
      
      // Suggest core cards first
      suggestions.push(...createSuggestions(archetypeData.core, 'core', existing_cards));
      
      // Then support cards
      suggestions.push(...createSuggestions(archetypeData.support, 'support', existing_cards));
      
      // Finally tech cards if deck has room
      if (deck_size < 40) {
        suggestions.push(...createSuggestions(archetypeData.tech, 'tech', existing_cards));
      }
    }

    // Add general good cards based on type
    if (card.types && card.types.length > 0) {
      const typeSpecificCards = getTypeSpecificStaples(card.types[0]);
      suggestions.push(...createSuggestions(typeSpecificCards, 'staple', existing_cards));
    }

    // Always suggest universal staples
    const universalStaples = [
      'Professor\'s Research',
      'Iono',
      'Boss\'s Orders',
      'Ultra Ball',
      'Switch Cart'
    ];
    suggestions.push(...createSuggestions(universalStaples, 'staple', existing_cards));

    // Remove duplicates and limit suggestions
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(s => [s.card_name, s])).values()
    ).slice(0, 15);

    res.json({
      card: card.name,
      archetype,
      suggestions: uniqueSuggestions,
      deck_building_tips: getDeckBuildingTips(card.name, archetype)
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Helper functions
function determineRelationshipType(sourceName, targetName, targetTypes) {
  // Evolution line detection
  if (sourceName.includes('ex') && targetName.includes('ex')) {
    return 'alternate_attacker';
  }
  
  // Support Pokemon
  if (['Bibarel', 'Radiant Greninja', 'Lumineon V', 'Pidgeot ex'].includes(targetName)) {
    return 'draw_support';
  }
  
  // Trainer cards
  if (targetTypes && targetTypes.includes('trainer')) {
    if (targetName.includes('Ball')) return 'search';
    if (['Iono', 'Professor\'s Research', 'Judge'].includes(targetName)) return 'draw_support';
    if (['Boss\'s Orders', 'Cross Switcher'].includes(targetName)) return 'disruption';
    if (targetName.includes('Stadium')) return 'stadium';
    return 'trainer_support';
  }
  
  // Energy
  if (targetTypes && targetTypes.includes('energy')) {
    return 'energy';
  }
  
  return 'synergy';
}

function findDeckArchetype(cardName) {
  for (const [archetype, data] of Object.entries(competitiveMeta.deckArchetypes)) {
    if (data.core.includes(cardName) || archetype === cardName) {
      return archetype;
    }
  }
  return null;
}

function createSuggestions(cardNames, category, existingCards) {
  return cardNames
    .filter(name => !existingCards.includes(name))
    .map(name => ({
      card_name: name,
      category,
      priority: category === 'core' ? 'high' : category === 'support' ? 'medium' : 'low'
    }));
}

function getTypeSpecificStaples(type) {
  const typeStaples = {
    'fire': ['Arcanine ex', 'Magma Basin', 'Fire Energy'],
    'water': ['Irida', 'Melony', 'Wash Energy'],
    'grass': ['Gardenia\'s Vigor', 'Forest Seal Stone', 'Grass Energy'],
    'lightning': ['Electric Generator', 'Beach Court', 'Lightning Energy'],
    'psychic': ['Fog Crystal', 'Gardevoir ex', 'Psychic Energy'],
    'fighting': ['Korrina\'s Focus', 'Fighting Energy'],
    'darkness': ['Dark Patch', 'Galarian Moltres V', 'Darkness Energy'],
    'metal': ['Metal Saucer', 'Metal Energy'],
    'dragon': ['Dragon Energy'],
    'colorless': ['Twin Energy', 'Powerful Energy']
  };
  
  return typeStaples[type] || [];
}

function getDeckBuildingTips(cardName, archetype) {
  const tips = [];
  
  if (archetype) {
    tips.push(`This card is a key part of the ${archetype} archetype`);
    tips.push('Focus on consistency with 4 copies of core cards');
  }
  
  if (cardName.includes('ex') || cardName.includes('VSTAR')) {
    tips.push('Consider including healing and protection cards');
    tips.push('Balance between attackers and support Pokemon');
  }
  
  tips.push('Include 10-15 draw/search trainers for consistency');
  tips.push('Add 2-4 switching cards for mobility');
  
  return tips;
}

module.exports = router;