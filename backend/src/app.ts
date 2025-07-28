import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { loadAppConfig } from './config/app';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger, responseTime, requestId } from './middleware/logger';
import { generalLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

// Initialize configuration
loadAppConfig();

// Initialize database
initializeDatabase();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' 
    ? process.env['FRONTEND_URL'] || 'http://localhost:3000'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request processing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging and monitoring middleware
app.use(requestId);
app.use(responseTime);
app.use(requestLogger);

// Rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import routes
import authRoutes from './routes/auth';
import ideaRoutes from './routes/ideas';
import configRoutes from './routes/config';
import voteRoutes from './routes/votes';
import commentRoutes from './routes/comments';
import adminRoutes from './routes/admin';
import userRoutes from './routes/users';

// API routes
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Ideas routes
app.use('/api/ideas', ideaRoutes);

// Vote routes
app.use('/api/votes', voteRoutes);

// Comment routes
app.use('/api/comments', commentRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Config routes
app.use('/api/config', configRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;