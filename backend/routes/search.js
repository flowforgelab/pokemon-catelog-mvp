const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/search/autocomplete - Fast autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Use PostgreSQL's similarity features for better matching
    const query = `
      SELECT DISTINCT 
        id,
        name,
        set_name,
        card_number,
        image_url,
        competitive_rating,
        similarity(name, $1) as score
      FROM cards
      WHERE 
        format_legal = true
        AND (
          name ILIKE $2
          OR similarity(name, $1) > 0.3
        )
      ORDER BY 
        CASE 
          WHEN name ILIKE $3 THEN 0
          WHEN name ILIKE $2 THEN 1
          ELSE 2
        END,
        similarity(name, $1) DESC,
        competitive_rating DESC,
        name
      LIMIT $4
    `;
    
    const searchTerm = q.trim();
    const params = [
      searchTerm,                    // $1 - for similarity
      `%${searchTerm}%`,             // $2 - for ILIKE anywhere
      `${searchTerm}%`,              // $3 - for starts with
      parseInt(limit)                // $4 - limit
    ];

    const result = await db.query(query, params);
    
    // Format suggestions for autocomplete
    const suggestions = result.rows.map(card => ({
      id: card.id,
      name: card.name,
      display: `${card.name} - ${card.set_name} #${card.card_number}`,
      image_url: card.image_url,
      competitive_tier: card.competitive_rating
    }));

    res.json({ 
      suggestions,
      query: q
    });

  } catch (error) {
    console.error('Autocomplete error:', error);
    
    // Fallback to simple search if similarity extension not available
    try {
      const fallbackQuery = `
        SELECT DISTINCT 
          id,
          name,
          set_name,
          card_number,
          image_url,
          competitive_rating
        FROM cards
        WHERE 
          format_legal = true
          AND name ILIKE $1
        ORDER BY 
          CASE 
            WHEN name ILIKE $2 THEN 0
            ELSE 1
          END,
          competitive_rating DESC,
          name
        LIMIT $3
      `;
      
      const result = await db.query(fallbackQuery, [
        `%${req.query.q}%`,
        `${req.query.q}%`,
        parseInt(limit)
      ]);
      
      const suggestions = result.rows.map(card => ({
        id: card.id,
        name: card.name,
        display: `${card.name} - ${card.set_name} #${card.card_number}`,
        image_url: card.image_url,
        competitive_tier: card.competitive_rating
      }));

      res.json({ suggestions, query: req.query.q });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Search service unavailable' });
    }
  }
});

// GET /api/search/advanced - Advanced search with multiple criteria
router.get('/advanced', async (req, res) => {
  try {
    const {
      name,
      text,           // Search in attack/ability text
      hp_min,
      hp_max,
      retreat_max,
      attack_cost_max,
      set,
      type,
      rarity,
      competitive_rating,
      sort = 'relevance',
      order = 'DESC',
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      WITH card_search AS (
        SELECT DISTINCT 
          c.*,
          ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types,
          COUNT(DISTINCT a.id) as attack_count,
          COUNT(DISTINCT ab.id) as ability_count,
          COALESCE(
            MAX(CASE WHEN c.name ILIKE $1 THEN 10 ELSE 0 END) +
            MAX(CASE WHEN a.text ILIKE $1 THEN 5 ELSE 0 END) +
            MAX(CASE WHEN ab.text ILIKE $1 THEN 5 ELSE 0 END),
            0
          ) as relevance_score
        FROM cards c
        LEFT JOIN card_types ct ON c.id = ct.card_id
        LEFT JOIN attacks a ON c.id = a.card_id
        LEFT JOIN abilities ab ON c.id = ab.card_id
        WHERE c.format_legal = true
    `;

    const params = [];
    let paramIndex = 1;
    const conditions = [];

    // Text search in name, attacks, and abilities
    const searchText = name || text;
    if (searchText) {
      params.push(`%${searchText}%`);
      paramIndex++;
    } else {
      params.push(''); // Placeholder for relevance calculation
      paramIndex++;
    }

    // HP range
    if (hp_min) {
      conditions.push(`c.hp >= $${paramIndex}`);
      params.push(parseInt(hp_min));
      paramIndex++;
    }

    if (hp_max) {
      conditions.push(`c.hp <= $${paramIndex}`);
      params.push(parseInt(hp_max));
      paramIndex++;
    }

    // Max retreat cost
    if (retreat_max) {
      conditions.push(`c.retreat_cost <= $${paramIndex}`);
      params.push(parseInt(retreat_max));
      paramIndex++;
    }

    // Set filter
    if (set) {
      conditions.push(`c.set_id = $${paramIndex}`);
      params.push(set);
      paramIndex++;
    }

    // Rarity filter
    if (rarity) {
      conditions.push(`c.rarity = $${paramIndex}`);
      params.push(rarity);
      paramIndex++;
    }

    // Competitive rating filter
    if (competitive_rating) {
      conditions.push(`c.competitive_rating = $${paramIndex}`);
      params.push(competitive_rating);
      paramIndex++;
    }

    // Add WHERE conditions
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    // Add GROUP BY
    query += ` GROUP BY c.id`;

    // Add HAVING for text search
    if (searchText) {
      query += ` HAVING (
        c.name ILIKE $1 OR 
        MAX(CASE WHEN a.text ILIKE $1 THEN 1 ELSE 0 END) = 1 OR
        MAX(CASE WHEN ab.text ILIKE $1 THEN 1 ELSE 0 END) = 1
      )`;
    }

    query += `)`;

    // Wrap for type filtering
    let finalQuery = `SELECT * FROM card_search`;
    
    if (type) {
      finalQuery += ` WHERE $${paramIndex} = ANY(types)`;
      params.push(type);
      paramIndex++;
    }

    // Add sorting
    const sortOptions = {
      'relevance': 'relevance_score DESC, competitive_rating DESC',
      'name': 'name',
      'hp': 'hp',
      'set': 'set_name, card_number::int',
      'competitive': 'competitive_rating DESC, name',
      'newest': 'set_id DESC, card_number::int DESC'
    };

    const sortClause = sortOptions[sort] || sortOptions['relevance'];
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    finalQuery += ` ORDER BY ${sortClause.includes('DESC') ? sortClause : `${sortClause} ${sortOrder}`}`;

    // Add pagination
    finalQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(finalQuery, params);

    // Get total count
    let countQuery = query.replace(
      'c.*, ARRAY_AGG(DISTINCT ct.type) FILTER (WHERE ct.type IS NOT NULL) as types, COUNT(DISTINCT a.id) as attack_count, COUNT(DISTINCT ab.id) as ability_count, COALESCE(MAX(CASE WHEN c.name ILIKE $1 THEN 10 ELSE 0 END) + MAX(CASE WHEN a.text ILIKE $1 THEN 5 ELSE 0 END) + MAX(CASE WHEN ab.text ILIKE $1 THEN 5 ELSE 0 END), 0) as relevance_score',
      'COUNT(DISTINCT c.id) as count'
    );
    
    if (type) {
      countQuery = `SELECT SUM(count) as count FROM (${countQuery}) sub WHERE $${params.length - 1} = ANY(types)`;
    } else {
      countQuery = `SELECT SUM(count) as count FROM (${countQuery}) sub`;
    }

    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || 0);

    res.json({
      cards: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      },
      search_criteria: {
        name,
        text,
        hp_min,
        hp_max,
        retreat_max,
        attack_cost_max,
        set,
        type,
        rarity,
        competitive_rating
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/search/suggestions - Get search suggestions based on popular searches
router.get('/suggestions', async (req, res) => {
  try {
    // Popular competitive cards that users often search for
    const popularSearches = [
      'Charizard ex',
      'Pidgeot ex',
      'Gardevoir ex',
      'Lost City',
      'Iono',
      'Professor\'s Research',
      'Boss\'s Orders',
      'Ultra Ball',
      'Rare Candy',
      'Battle VIP Pass'
    ];

    // Get top competitive cards
    const query = `
      SELECT name, competitive_rating, set_name
      FROM cards
      WHERE 
        format_legal = true
        AND competitive_rating IN ('competitive', 'playable')
      ORDER BY 
        competitive_rating DESC,
        name
      LIMIT 20
    `;

    const result = await db.query(query);
    
    const suggestions = {
      popular: popularSearches,
      competitive: result.rows.map(card => card.name),
      recent_sets: ['Obsidian Flames', 'Paldea Evolved', 'Scarlet & Violet'],
      card_types: ['Pokemon', 'Trainer', 'Energy'],
      search_tips: [
        'Search by card name (e.g., "Charizard")',
        'Search by ability text (e.g., "draw cards")',
        'Filter by HP range (e.g., "130+ HP")',
        'Find cards by type (e.g., "Fire type")'
      ]
    };

    res.json(suggestions);

  } catch (error) {
    // Return static suggestions if database is unavailable
    res.json({
      popular: ['Charizard ex', 'Pidgeot ex', 'Iono'],
      competitive: [],
      recent_sets: ['Obsidian Flames', 'Paldea Evolved'],
      card_types: ['Pokemon', 'Trainer', 'Energy'],
      search_tips: ['Search by card name or text']
    });
  }
});

module.exports = router;