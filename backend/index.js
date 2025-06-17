const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const db = require('./config/database');
// Use mock routes if database is not available
const useMockData = process.env.USE_MOCK_DATA === 'true';
console.log('USE_MOCK_DATA:', process.env.USE_MOCK_DATA);
console.log('Using mock data:', useMockData);
const cardRoutes = useMockData ? require('./routes/cards-mock') : require('./routes/cards');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production' && origin.includes('netlify.app')) {
      // Allow any Netlify preview deployments
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production' && origin.includes('vercel.app')) {
      // Allow any Vercel preview deployments
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/cards', cardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/relationships', require('./routes/relationships'));

// Health check
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    useMockData: useMockData,
    environment: process.env.NODE_ENV
  };
  
  if (!useMockData) {
    try {
      const result = await db.query('SELECT COUNT(*) FROM cards');
      health.database = 'Connected';
      health.cardCount = parseInt(result.rows[0].count);
    } catch (error) {
      health.database = 'Error';
      health.error = error.message;
    }
  }
  
  res.json(health);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Pokemon Catalog MVP API running on port ${PORT}`);
});