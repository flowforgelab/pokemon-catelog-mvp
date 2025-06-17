# Pokemon Card Catalog MVP

A competitive-focused Pokemon TCG card database with advanced search, filtering, and strategic tools.

## 🚀 Quick Start

### Development

1. **Backend** (Port 3001)
```bash
cd backend
npm install
npm start
```

2. **Frontend** (Port 3000)
```bash
cd frontend
npm install
npm start
```

Visit http://localhost:3000

## 📁 Project Structure

```
pokemon-catalog-mvp/
├── backend/          # Express.js API server
├── frontend/         # React TypeScript app
├── database/         # PostgreSQL schema
├── scripts/          # Import and testing utilities
└── README-STEP*.md   # Development documentation
```

## ✨ Features

- **Search & Filter**: Real-time search with type, rarity, and set filters
- **Card Details**: Full card information with abilities and attacks
- **Attack Calculator**: Damage calculation with weakness/resistance
- **Format Indicators**: Standard legality badges
- **Responsive Design**: Mobile-first approach
- **Performance**: Lazy loading and optimized rendering

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL (or mock data)
- **API**: Pokemon TCG API v2
- **Deployment**: Netlify/Vercel (frontend), Railway (backend)

## 📊 Current Status

All 5 MVP steps completed:
1. ✅ Foundation & Data Setup
2. ✅ Core Backend Features  
3. ✅ Frontend Development
4. ✅ Strategic Features & Polish
5. ✅ Deployment & Launch Preparation

Currently using mock data with 3 competitive cards. Database schema ready for full implementation.

## 🚀 Deployment

See [README-STEP5.md](./README-STEP5.md) for detailed deployment instructions.

### Quick Deploy

**Frontend (Netlify)**
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/pokemon-catalog-mvp)

**Backend (Railway)**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/pokemon-catalog-mvp)

## 🔧 Environment Variables

### Frontend
- `REACT_APP_API_URL`: Backend API URL

### Backend
- `USE_MOCK_DATA`: Use mock data (true) or database (false)
- `CORS_ORIGIN`: Frontend URL
- `PORT`: Server port (default: 3001)

## 📈 Future Enhancements

- Import 10,000+ cards from Pokemon TCG API
- User accounts and collection tracking
- Deck builder with export
- Price tracking integration
- Tournament results
- Mobile apps

## 📝 License

This project is for educational purposes. Pokemon and Pokemon TCG are trademarks of Nintendo/Creatures Inc./GAME FREAK inc.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ for the Pokemon TCG community