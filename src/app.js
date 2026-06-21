// ──────────────────────────────────────────────────
// AcademiaFlow LMS — Backend API Server
// ──────────────────────────────────────────────────

require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// ── Initialize Express ───────────────────────────
const app = express();

// ── Security Middleware ──────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://acadmiaflow.vercel.app"
    ],
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE"],
    allowedHeaders: ["Content-Type","Authorization"]
  })
);

// ── Rate Limiting ────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// ── Body Parsers ─────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Welcome / Root Route ──────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the AcademiaFlow LMS Backend API',
    data: {
      healthCheck: '/api/health',
      timestamp: new Date().toISOString(),
    }
  });
});

// ── Health Check ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AcademiaFlow API is running',
    data: {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }
  });
});


// ── API Routes ───────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ──────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ── Global Error Handler ─────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
      console.log('');
      console.log('══════════════════════════════════════════');
      console.log('  🎓 AcademiaFlow LMS — Backend API');
      console.log('══════════════════════════════════════════');
      console.log(`  🚀 Server:      http://localhost:${PORT}`);
      console.log(`  📡 API Base:    http://localhost:${PORT}/api`);
      console.log(`  ❤️  Health:      http://localhost:${PORT}/api/health`);
      console.log(`  🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('══════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
