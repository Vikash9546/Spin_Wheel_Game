const { PrismaClient } = require('@prisma/client');
const { dbUrl } = require('../config');

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
});

module.exports = prisma;
