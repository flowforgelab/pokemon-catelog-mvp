const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all cards with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      rarity, 
      set, 
      search, 
      hp_min,
      hp_max,
      retreat_max,
      competitive_rating,
      has_ability,
      sort = 'name', 
      order = 'ASC',
      limit = 50,
      offset = 0 
    } = req.query;

    let query = `
      SELECT DISTINCT c.*, 
        ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types
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
    
    const sortField = sortOptions[sort] || sortOptions['name'];
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Special handling for rarity and competitive_rating (already ordered)
    if (sort === 'rarity' || sort === 'competitive_rating') {
      query += ` ORDER BY ${sortField} ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}, c.name ASC`;
    } else {
      query += ` ORDER BY ${sortField} ${sortOrder}`;
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

    res.json({
      cards: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// GET single card by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get card details
    const cardQuery = `
      SELECT c.*, 
        ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types
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