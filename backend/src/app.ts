// backend/src/app.ts - CORS ayarlarını güncelle
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import chatRoutes from './routes/chats';
import userRoutes from './routes/users';
import { setupSocketHandlers } from './services/socketService';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';

dotenv.config();

const app = express();
const server = createServer(app);

// CORS origins - hem production hem development
const allowedOrigins = [
  "https://justconnect-ui.onrender.com",  // Production frontend
  "http://localhost:3000",                // Development frontend
  "https://justconnect-o8k8.onrender.com" // Backend itself (if needed)
];

// Socket.io server with updated CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize services
initializeDatabase();
initializeRedis();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Render.com compatibility
}));

// Updated CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: allowedOrigins
  });
});

// Debug endpoint to check CORS
app.get('/api/debug/cors', (req, res) => {
  res.json({
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins,
    headers: req.headers
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// Socket.io setup
setupSocketHandlers(io);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Socket.io server ready`);
  console.log(`🌍 Allowed CORS origins:`, allowedOrigins);
});

export { io };