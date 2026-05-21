const { PrismaClient } = require('@prisma/client');
const { dbUrl } = require('../config');

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
  // Connection pool tuning for 100+ concurrent users
  // Prisma uses a connection pool internally; these logs help debug pool exhaustion
  log: process.env.NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['error'],
});

module.exports = prisma;
