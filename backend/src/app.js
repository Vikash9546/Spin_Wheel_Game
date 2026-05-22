require('dotenv').config();
require('./utils/bigint'); // Monkey-patch BigInt JSON serialization
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

const { initSocket } = require('./websocket/socket.server');
const { initQueue, initWorker, closeQueueAndWorkers } = require('./jobs/queue');
const { recoverActiveGames } = require('./jobs/recovery.job');
const prisma = require('./db/prisma');

const authRouter = require('./modules/auth/auth.routes');
const wheelRouter = require('./modules/wheels/wheel.routes');
const walletRouter = require('./modules/wallets/wallet.routes');
const authMiddleware = require('./middlewares/auth');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`🌐 [Request] ${req.method} ${req.url}`);
  next();
});

// Public Auth Routes
app.use('/api/auth', authRouter);

// Protected Game and Wallet Routes
app.use('/api', authMiddleware, wheelRouter);
app.use('/api', authMiddleware, walletRouter);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(`🔴 [Error] ${req.method} ${req.url}:`, err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const server = http.createServer(app);

// Initialize Sockets
initSocket(server);

// Initialize BullMQ Queue and Worker
initQueue();
initWorker();

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  
  // Execute startup recovery logic for active games
  await recoverActiveGames();
});

// Graceful Shutdown Handler
let isShuttingDown = false;
async function handleGracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 [Shutdown] Received ${signal}. Starting graceful termination...`);

  try {
    // 1. Close WebSockets and HTTP server
    server.close(() => {
      console.log('🛑 [Shutdown] HTTP and Socket server stopped listening.');
    });

    // 2. Shut down BullMQ queues and workers
    await closeQueueAndWorkers();

    // 3. Disconnect database client
    await prisma.$disconnect();
    console.log('🛑 [Shutdown] Database connections closed.');

    console.log('✅ [Shutdown] Graceful exit complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Shutdown] Error during termination:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Warning] Unhandled Rejection at:', promise, 'reason:', reason);
});

