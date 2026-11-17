require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

// Connect to MongoDB
connectDB();

const app = express();

// Trust Render's proxy so rate-limiting and req.ip work correctly in production
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin, curl, mobile, Postman (no origin header)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      
      // Auto-allow all Render preview domains in production
      if (process.env.NODE_ENV === 'production' && origin.endsWith('.onrender.com')) {
        return cb(null, true);
      }
      
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

// Rate limiting on /api
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (frontend + uploads)
// maxAge: 1 day tells browsers to cache static assets for performance
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CivicFix API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/comments', require('./routes/commentRoutes').commentRouter);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/moderator', require('./routes/moderatorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 + error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});