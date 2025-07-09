// backend/src/app.ts - Enhanced Socket.IO configuration for production
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
import SocketService from './services/socketService';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';

dotenv.config();

const app = express();
const server = createServer(app);

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    "https://justconnect-ui.onrender.com",
    "http://localhost:3000", // For development
    /^https:\/\/.*\.onrender\.com$/, // Allow all Render subdomains
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

// Enhanced Socket.IO configuration for production
const io = new Server(server, {
  cors: {
    origin: [
      "https://justconnect-ui.onrender.com",
      "http://localhost:3000", // For development
      /^https:\/\/.*\.onrender\.com$/, // Allow all Render subdomains
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // Set to false for better compatibility
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
  pingInterval: 25000,
  cookie: false, // Disable cookies for better CORS compatibility
  // Additional configuration for production
  serveClient: false, // Don't serve the client files
  path: '/socket.io/', // Explicit path
});

// Initialize services
async function initializeServices() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    await initializeRedis();
    console.log('✅ Redis initialized');
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// Enhanced middleware setup
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow cross-origin for Socket.IO
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"], // Allow WebSocket connections
    },
  },
}));

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    socketConnections: io.engine.clientsCount || 0,
    memory: process.memoryUsage(),
  };
  
  console.log('🏥 Health check requested:', healthCheck);
  res.json(healthCheck);
});

// Socket.IO health check
app.get('/socket-health', (req, res) => {
  const socketHealth = {
    status: 'OK',
    connectedClients: io.engine.clientsCount || 0,
    engineInfo: {
      pingTimeout: io.opts.pingTimeout,
      pingInterval: io.opts.pingInterval,
      maxHttpBufferSize: io.opts.maxHttpBufferSize,
      transports: io.opts.transports,
    },
    timestamp: new Date().toISOString(),
  };
  
  console.log('🔌 Socket health check:', socketHealth);
  res.json(socketHealth);
});

// CORS preflight for all routes
app.options('*', cors(corsOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// Socket.IO setup with enhanced error handling
console.log('🔌 Setting up Socket.IO server...');

// Log connection events
io.engine.on('initial_headers', (headers, req) => {
  console.log('📋 Initial headers:', {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    forwarded: req.headers['x-forwarded-for'],
  });
});

io.engine.on('headers', (headers, req) => {
  console.log('📋 Request headers for:', req.url);
});

io.engine.on('connection_error', (err) => {
  console.error('❌ Socket.IO connection error:', {
    message: err.message,
    description: err.description,
    context: err.context,
    type: err.type,
  });
});

// Connection logging
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  console.log(`📊 Total connections: ${io.engine.clientsCount}`);
  console.log(`🔍 Client info:`, {
    id: socket.id,
    transport: socket.conn.transport.name,
    address: socket.handshake.address,
    headers: {
      origin: socket.handshake.headers.origin,
      userAgent: socket.handshake.headers['user-agent'],
    },
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
    console.log(`📊 Remaining connections: ${io.engine.clientsCount}`);
  });
  
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error);
  });
});

// Initialize Socket Service
new SocketService(io);
console.log('✅ Socket.IO service initialized');

// Global error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Handle 404
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Start server with initialization
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      console.log('🚀 Server configuration:');
      console.log(`   📍 Port: ${PORT}`);
      console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   🔌 Socket.IO: Enabled with transports [websocket, polling]`);
      console.log(`   📡 CORS Origins: ${JSON.stringify(corsOptions.origin)}`);
      console.log(`   💾 Memory Usage: ${JSON.stringify(process.memoryUsage())}`);
      console.log('✅ Server is running and ready to accept connections');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };