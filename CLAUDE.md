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

All 5 MVP steps completed:
1. ✅ Foundation & database setup
2. ✅ Core backend features (search, filter, competitive ratings)
3. ✅ Frontend with React/TypeScript/Tailwind
4. ✅ Strategic features (attack calculator, format badges, error handling)
5. ✅ Deployment & Launch preparation

Ready for production deployment to Netlify (frontend) and Railway (backend).

## Development Notes

### Mock Data Mode
Currently using mock data with 3 cards (Charizard ex, Pidgeot ex, Gardevoir ex). To use real database:
1. Set up PostgreSQL
2. Run schema.sql
3. Set `USE_MOCK_DATA=false` in backend/.env
4. Run import-cards.js

### Common Issues
- CORS errors: Ensure backend is running on port 3001
- No cards showing: Check if backend is running and responding
- TypeScript errors in frontend: Often related to Pokemon card type definitions

### Testing Features
- Attack Calculator: Click any card → "Damage Calculator" button
- Format Filter: Use "Standard Legal Only" checkbox in sidebar
- Error Handling: Stop backend and refresh to see error UI