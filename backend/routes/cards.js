const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Test database connection
router.get('/test', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM cards');
    const typesResult = await db.query('SELECT COUNT(*) FROM card_types');
    res.json({
      status: 'ok',
      cards: result.rows[0].count,
      types: typesResult.rows[0].count,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      database: 'failed'
    });
  }
});

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
      sortBy = 'name', // frontend sends as sortBy
      sortOrder = 'asc', // frontend sends as sortOrder
      page = 1, // frontend sends page, not offset
      limit = 50
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let baseQuery = `
      SELECT c.*, 
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

    // Add search condition
    if (search) {
      baseQuery += ` AND c.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add set filter
    if (set) {
      baseQuery += ` AND c.set_id = $${paramIndex}`;
      params.push(set);
      paramIndex++;
    }

    // Add rarity filter
    if (rarity) {
      baseQuery += ` AND c.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }

    // Group by to aggregate types
    baseQuery += ` GROUP BY c.id`;

    // Wrap in subquery to filter by types after aggregation
    let query = baseQuery;
    if (type) {
      query = `
        SELECT * FROM (${baseQuery}) AS cards_with_types
        WHERE $${paramIndex} = ANY(ARRAY(SELECT json_array_elements_text(types)))
      `;
      params.push(type);
      paramIndex++;
    }

    // Add sorting
    const sortOptions = {
      'name': 'name',
      'number': 'CAST(card_number AS INTEGER)',
      'rarity': `CASE rarity 
        WHEN 'Special Illustration Rare' THEN 1
        WHEN 'Hyper Rare' THEN 2
        WHEN 'Ultra Rare' THEN 3
        WHEN 'Double Rare' THEN 4
        WHEN 'Illustration Rare' THEN 5
        WHEN 'Rare' THEN 6
        WHEN 'Uncommon' THEN 7
        WHEN 'Common' THEN 8
        ELSE 9
      END`,
      'set': 'set_id, CAST(card_number AS INTEGER)'
    };
    
    const sortField = sortOptions[sortBy] || sortOptions['name'];
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY ${sortField} ${sortDirection}`;
    
    // Add pagination
    const limitParam = paramIndex++;
    const offsetParam = paramIndex++;
    query += ` LIMIT $${limitParam} OFFSET $${offsetParam}`;
    params.push(parseInt(limit), parseInt(offset));

    // Execute query
    const result = await db.query(query, params);
    
    // Get total count (without pagination)
    let countQuery = baseQuery;
    if (type) {
      countQuery = `
        SELECT COUNT(*) FROM (${baseQuery}) AS cards_with_types
        WHERE $${params.length - 2} = ANY(ARRAY(SELECT json_array_elements_text(types)))
      `;
    } else {
      countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS count_query`;
    }
    
    const countParams = params.slice(0, -2); // Remove limit and offset
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
      page: parseInt(page),
      pageSize: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cards',
      message: error.message,
      detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

module.exports = router;