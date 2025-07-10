// backend/src/app.ts - Render için güncellenmiş ayarlar

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

// Render için özel Socket.io ayarları
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "https://justconnect-ui.onrender.com",
      "http://localhost:3000",
      "https://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  // Render için kritik ayarlar
  transports: ['polling', 'websocket'], // Polling önce!
  allowEIO3: true, // Engine.io v3 desteği
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  // Render specific
  path: '/socket.io',
  serveClient: false,
  // Connection retry ayarları
  connectTimeout: 45000,
  forceNew: false
});

// Initialize services
initializeDatabase();
initializeRedis();

// Render için güvenlik ayarları
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "https://justconnect-ui.onrender.com",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Render health check - önemli!
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    socketConnections: io.sockets.sockets.size
  });
});

// Socket.io endpoint test
app.get('/socket-test', (req, res) => {
  res.json({
    status: 'Socket.io server active',
    activeConnections: io.sockets.sockets.size,
    transports: ['polling', 'websocket']
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// Socket.io setup
setupSocketHandlers(io);

// Render için error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 10000; // Render default port

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Socket.io server ready with transports: polling, websocket`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

export { io };