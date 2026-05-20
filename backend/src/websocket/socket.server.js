const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all for demo, configure in production
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
      const decoded = jwt.verify(cleanToken, jwtSecret);
      socket.user = decoded; // Attach user payload to socket
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 Client connected: socket.id=${socket.id}, userId=${userId}`);

    // Allow clients to join specific room for a spin wheel
    socket.on('joinWheelRoom', (wheelId) => {
      socket.join(`wheel:${wheelId}`);
      console.log(`👤 User ${userId} joined room wheel:${wheelId}`);
    });

    socket.on('leaveWheelRoom', (wheelId) => {
      socket.leave(`wheel:${wheelId}`);
      console.log(`👤 User ${userId} left room wheel:${wheelId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: socket.id=${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
}

/**
 * Emit event to a specific user.
 */
function emitToUser(userId, event, data) {
  if (!io) return;
  // Send event to all sockets matching userId
  io.sockets.sockets.forEach((socket) => {
    if (socket.user && socket.user.id === userId) {
      socket.emit(event, data);
    }
  });
}

/**
 * Emit event to a wheel room.
 */
function emitToWheel(wheelId, event, data) {
  if (!io) return;
  io.to(`wheel:${wheelId}`).emit(event, data);
}

/**
 * Emit event globally.
 */
function broadcast(event, data) {
  if (!io) return;
  io.emit(event, data);
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToWheel,
  broadcast,
};
