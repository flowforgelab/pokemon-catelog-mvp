-- Pokemon Card Catalog MVP Database Schema
-- PostgreSQL schema for storing Pokemon TCG card data

-- Create database if not exists
-- CREATE DATABASE pokemon_catalog_mvp;

-- Card types enum
CREATE TYPE card_type AS ENUM (
    'grass', 'fire', 'water', 'lightning', 'psychic', 'fighting',
    'darkness', 'metal', 'fairy', 'dragon', 'colorless',
    'trainer', 'energy'
);

-- Rarity enum
CREATE TYPE rarity_type AS ENUM (
    'common', 'uncommon', 'rare', 'rare_holo',
    'rare_ultra', 'rare_secret', 'rare_shiny',
    'amazing_rare', 'radiant_rare', 'special_illustration_rare'
);

-- Competitive tier enum
CREATE TYPE competitive_tier AS ENUM (
    'competitive', 'playable', 'casual'
);

-- Main cards table
CREATE TABLE cards (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    set_id VARCHAR(50) NOT NULL,
    set_name VARCHAR(200) NOT NULL,
    card_number VARCHAR(20) NOT NULL,
    rarity rarity_type NOT NULL,
    hp INTEGER,
    retreat_cost INTEGER DEFAULT 0,
    format_legal BOOLEAN DEFAULT true,
    competitive_rating competitive_tier DEFAULT 'casual',
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Card types junction table (many-to-many)
CREATE TABLE card_types (
    card_id VARCHAR(50) REFERENCES cards(id) ON DELETE CASCADE,
    type card_type NOT NULL,
    PRIMARY KEY (card_id, type)
);

-- Attacks table
CREATE TABLE attacks (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(50) REFERENCES cards(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    cost VARCHAR(50), -- Simplified energy cost representation
    damage VARCHAR(50), -- Can be numeric or with modifiers like "20+"
    text TEXT,
    position INTEGER DEFAULT 0 -- Order of attacks on card
);

-- Abilities table
CREATE TABLE abilities (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(50) REFERENCES cards(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'Ability'
);

-- Related cards table for "Often played with" feature
CREATE TABLE related_cards (
    card_id VARCHAR(50) REFERENCES cards(id) ON DELETE CASCADE,
    related_card_id VARCHAR(50) REFERENCES cards(id) ON DELETE CASCADE,
    relevance_score INTEGER DEFAULT 1,
    PRIMARY KEY (card_id, related_card_id),
    CHECK (card_id != related_card_id)
);

-- Indexes for performance
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_set ON cards(set_id);
CREATE INDEX idx_cards_competitive ON cards(competitive_rating);
CREATE INDEX idx_cards_format_legal ON cards(format_legal);
CREATE INDEX idx_card_types_type ON card_types(type);

-- Full text search index
CREATE INDEX idx_cards_name_text ON cards USING GIN(to_tsvector('english', name));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();