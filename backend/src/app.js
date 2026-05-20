require('dotenv').config();
require('./utils/bigint'); // Monkey-patch BigInt JSON serialization
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

const { initSocket } = require('./websocket/socket.server');
const { initQueue, initWorker } = require('./jobs/queue');
const { recoverActiveGames } = require('./jobs/recovery.job');

const authRouter = require('./modules/auth/auth.routes');
const wheelRouter = require('./modules/wheels/wheel.routes');
const authMiddleware = require('./middlewares/auth');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Public Auth Routes
app.use('/api/auth', authRouter);

// Protected Game Routes
app.use('/api', authMiddleware, wheelRouter);

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
