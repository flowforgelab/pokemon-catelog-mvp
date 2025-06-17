const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /search endpoint - matches frontend expectations
router.get('/search', async (req, res) => {
  try {
    const { 
      type, 
      types, // frontend sends as 'types' array
      rarity,
      rarities, // frontend sends as 'rarities' array
      set,
      sets, // frontend sends as 'sets' array
      search, 
      hp_min,
      hp_max,
      retreat_max,
      competitive_rating,
      has_ability,
      sortBy = 'name', // frontend sends as sortBy
      sortOrder = 'asc', // frontend sends as sortOrder
      page = 1, // frontend sends page, not offset
      limit = 50
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT DISTINCT c.*, 
        COALESCE(
          json_agg(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL),
          '[]'::json
        ) as types
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE c.format_legal = true
    `;
    
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (search) {
      query += ` AND c.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (set) {
      query += ` AND c.set_id = $${paramIndex}`;
      params.push(set);
      paramIndex++;
    }

    if (rarity) {
      query += ` AND c.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }

    if (hp_min) {
      query += ` AND c.hp >= $${paramIndex}`;
      params.push(parseInt(hp_min));
      paramIndex++;
    }

    if (hp_max) {
      query += ` AND c.hp <= $${paramIndex}`;
      params.push(parseInt(hp_max));
      paramIndex++;
    }

    if (retreat_max !== undefined) {
      query += ` AND c.retreat_cost <= $${paramIndex}`;
      params.push(parseInt(retreat_max));
      paramIndex++;
    }

    if (competitive_rating) {
      query += ` AND c.competitive_rating = $${paramIndex}`;
      params.push(competitive_rating);
      paramIndex++;
    }

    if (has_ability === 'true') {
      query += ` AND EXISTS (SELECT 1 FROM abilities WHERE card_id = c.id)`;
    }

    query += ` GROUP BY c.id`;

    // Filter by type after grouping
    if (type) {
      query = `SELECT * FROM (${query}) AS filtered_cards WHERE $${paramIndex} = ANY(types)`;
      params.push(type);
      paramIndex++;
    }

    // Add sorting with enhanced options
    const sortOptions = {
      'name': 'c.name',
      'card_number': 'c.card_number::int',
      'rarity': `CASE c.rarity 
        WHEN 'rare_secret' THEN 1
        WHEN 'rare_ultra' THEN 2
        WHEN 'rare_shiny' THEN 3
        WHEN 'special_illustration_rare' THEN 4
        WHEN 'rare_holo' THEN 5
        WHEN 'rare' THEN 6
        WHEN 'uncommon' THEN 7
        WHEN 'common' THEN 8
        ELSE 9
      END`,
      'competitive_rating': `CASE c.competitive_rating
        WHEN 'competitive' THEN 1
        WHEN 'playable' THEN 2
        WHEN 'casual' THEN 3
      END`,
      'hp': 'c.hp',
      'retreat_cost': 'c.retreat_cost',
      'set': 'c.set_id, c.card_number::int',
      'newest': 'c.created_at'
    };
    
    const sortField = sortOptions[sortBy] || sortOptions['name'];
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Special handling for rarity and competitive_rating (already ordered)
    if (sortBy === 'rarity' || sortBy === 'competitive_rating') {
      query += ` ORDER BY ${sortField} ${sortDirection}, c.name ASC`;
    } else {
      query += ` ORDER BY ${sortField} ${sortDirection}`;
    }

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) 
      FROM cards c 
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE c.format_legal = true
    `;
    
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND c.name ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (set) {
      countQuery += ` AND c.set_id = $${countParamIndex}`;
      countParams.push(set);
      countParamIndex++;
    }

    if (rarity) {
      countQuery += ` AND c.rarity = $${countParamIndex}`;
      countParams.push(rarity);
      countParamIndex++;
    }

    if (type) {
      countQuery += ` AND EXISTS (SELECT 1 FROM card_types WHERE card_id = c.id AND type = $${countParamIndex})`;
      countParams.push(type);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Transform cards to match frontend format
    const transformedCards = result.rows.map(card => ({
      ...card,
      types: card.types || [], // Ensure types is always an array
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
                         card.competitive_rating === 'playable' ? 2 : 1
    }));
    
    res.json({
      cards: transformedCards,
      totalCount: total,
      page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      pageSize: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// GET filters endpoint
router.get('/filters', async (req, res) => {
  try {
    // Get types
    const typesResult = await db.query(`
      SELECT DISTINCT type FROM card_types ORDER BY type
    `);
    const types = typesResult.rows.map(row => 
      row.type.charAt(0).toUpperCase() + row.type.slice(1)
    );

    // Get rarities
    const raritiesResult = await db.query(`
      SELECT DISTINCT rarity FROM cards WHERE rarity IS NOT NULL ORDER BY rarity
    `);
    const rarities = raritiesResult.rows.map(row => row.rarity);

    // Get sets
    const setsResult = await db.query(`
      SELECT DISTINCT set_id as id, set_name as name 
      FROM cards 
      WHERE format_legal = true
      ORDER BY set_name
    `);
    const sets = setsResult.rows;

    res.json({ types, rarities, sets });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// GET single card by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get card details
    const cardQuery = `
      SELECT c.*, 
        COALESCE(
          json_agg(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL),
          '[]'::json
        ) as types
      FROM cards c
      LEFT JOIN card_types ct ON c.id = ct.card_id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const cardResult = await db.query(cardQuery, [id]);
    
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    const card = cardResult.rows[0];
    
    // Get attacks
    const attacksQuery = `
      SELECT * FROM attacks 
      WHERE card_id = $1 
      ORDER BY position
    `;
    const attacksResult = await db.query(attacksQuery, [id]);
    card.attacks = attacksResult.rows;
    
    // Get abilities
    const abilitiesQuery = `
      SELECT * FROM abilities 
      WHERE card_id = $1
    `;
    const abilitiesResult = await db.query(abilitiesQuery, [id]);
    card.abilities = abilitiesResult.rows;
    
    // Get related cards
    const relatedQuery = `
      SELECT c.id, c.name, c.image_url, rc.relevance_score
      FROM related_cards rc
      JOIN cards c ON rc.related_card_id = c.id
      WHERE rc.card_id = $1
      ORDER BY rc.relevance_score DESC
      LIMIT 5
    `;
    const relatedResult = await db.query(relatedQuery, [id]);
    card.related_cards = relatedResult.rows;
    
    res.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// GET card types
router.get('/meta/types', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT unnest(enum_range(NULL::card_type)) as type
      ORDER BY type
    `);
    res.json(result.rows.map(row => row.type));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch card types' });
  }
});

// GET rarities
router.get('/meta/rarities', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT unnest(enum_range(NULL::rarity_type)) as rarity
      ORDER BY rarity
    `);
    res.json(result.rows.map(row => row.rarity));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rarities' });
  }
});

// GET sets
router.get('/meta/sets', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT set_id, set_name 
      FROM cards 
      WHERE format_legal = true
      ORDER BY set_name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
});

module.exports = router;