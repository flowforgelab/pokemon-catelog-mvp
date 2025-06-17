# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokemon Card Catalog MVP - A competitive-focused Pokemon TCG card database with search, filtering, and strategic tools. The project is currently at Step 4 of 5 in the MVP phase.

## Architecture

### Project Structure
- **backend/**: Express.js API server (runs on port 3001)
- **frontend/**: React TypeScript app with Tailwind CSS (runs on port 3000)
- **database/**: PostgreSQL schema definitions
- **scripts/**: Import and testing utilities

### Technology Stack
- Backend: Node.js, Express, PostgreSQL (or mock data mode)
- Frontend: React 19, TypeScript, Tailwind CSS v3, React Router v7
- API Integration: Pokemon TCG API v2

## Essential Commands

### Backend Development
```bash
cd backend
npm start          # Start server (port 3001)
npm run dev        # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start          # Start React dev server (port 3000)
npm run build      # Production build
```

### Database & Testing
```bash
cd scripts
node test-connection.js    # Test all connections
node import-cards.js       # Import Pokemon TCG data
node test-step1.js         # Test backend functionality
```

## Configuration

### Backend Environment (.env)
- `USE_MOCK_DATA=true` - Currently using mock data (3 cards)
- `PORT=3001` - Backend server port
- `CORS_ORIGIN=http://localhost:3000` - Frontend URL
- Database config available but not currently used

## Key API Endpoints

- `GET /api/cards/search` - Main search with pagination, filters, sorting
- `GET /api/cards/:id` - Single card details
- `GET /api/cards/filters` - Available filter options
- `GET /api/search/suggestions` - Autocomplete suggestions
- `GET /api/relationships/:id` - Related cards for deck building

## Frontend Components

### Core Components
- **CardGrid/CardItem**: Display Pokemon cards with lazy loading
- **CardDetail**: Modal with full card info and attack calculator
- **FilterSidebar**: Type, rarity, set, and Standard format filtering
- **SearchBar**: Real-time search with debounced suggestions
- **AttackCalculator**: Damage calculation with weakness/resistance

### State Management
- Local state with React hooks
- Search parameters managed in Home page component
- Error handling with ErrorBoundary component

## Current Status

All 6 MVP steps completed:
1. ✅ Foundation & database setup
2. ✅ Core backend features (search, filter, competitive ratings)
3. ✅ Frontend with React/TypeScript/Tailwind
4. ✅ Strategic features (attack calculator, format badges, error handling)
5. ✅ Deployment & Launch preparation
6. ✅ Real data import (250 Pokemon cards from TCG API)

**Live Production URLs:**
- Frontend: https://benevolent-mousse-8fe32b.netlify.app
- Backend: https://pokemon-catelog-mvp-production.up.railway.app/api
- Database: PostgreSQL on Railway with 250 cards

## Development Notes

### Database Mode
Production is using real PostgreSQL database with 250 Pokemon cards.
- Mock data mode available by setting `USE_MOCK_DATA=true`
- Database contains Standard-legal cards with competitive ratings
- Types stored as JSON arrays using `json_agg` in PostgreSQL

### Common Issues & Solutions
- **CORS errors**: Check CORS_ORIGIN matches frontend URL
- **No cards showing**: Verify USE_MOCK_DATA=false and database connection
- **Types.map error**: Frontend handles both array and string formats
- **500 errors**: Fixed by proper GROUP BY placement in SQL queries
- **Railway deployment stuck**: Remove stuck deployment and redeploy

### Testing Features
- Attack Calculator: Click any card → "Damage Calculator" button
- Format Filter: Use "Standard Legal Only" checkbox in sidebar
- Error Handling: Stop backend and refresh to see error UI