const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { redisUrl } = require('../config');

let redisConnection = null;
let wheelQueue = null;
let wheelWorker = null;

function getRedisConnection() {
  if (!redisConnection) {
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return redisConnection;
}

function initQueue() {
  const connection = getRedisConnection();
  
  wheelQueue = new Queue('wheel-queue', {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000, // Retry in 5s, 10s, 20s...
      },
      removeOnComplete: true, // Keep Redis clean
      removeOnFail: false,   // Keep failed jobs for inspection
    },
  });

  return wheelQueue;
}

function getQueue() {
  if (!wheelQueue) {
    initQueue();
  }
  return wheelQueue;
}

function initWorker() {
  const connection = getRedisConnection();

  // Lazy-load job handlers to prevent circular dependencies
  const wheelStartJob = require('./wheelStart.job');
  const eliminationJob = require('./elimination.job');
  const refundJob = require('./refund.job');

  wheelWorker = new Worker(
    'wheel-queue',
    async (job) => {
      console.log(`[BullMQ] Starting job ${job.id} [${job.name}]`);
      try {
        if (job.name === 'wheelStart') {
          return await wheelStartJob.process(job);
        } else if (job.name === 'elimination') {
          return await eliminationJob.process(job);
        } else if (job.name === 'refund') {
          return await refundJob.process(job);
        } else {
          console.warn(`[BullMQ] Unknown job name: ${job.name}`);
        }
      } catch (err) {
        console.error(`[BullMQ] Error processing job ${job.id} [${job.name}]:`, err);
        throw err; // Let BullMQ handle retries
      }
    },
    {
      connection,
      concurrency: 1, // Concurrency 1 ensures we serialize game states per worker process
    }
  );

  wheelWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} [${job.name}] completed`);
  });

  wheelWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job.id} [${job.name}] failed:`, err.message);
  });

  return wheelWorker;
}

module.exports = {
  getRedisConnection,
  initQueue,
  getQueue,
  initWorker,
};
