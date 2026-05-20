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

    redisConnection.on('error', (err) => {
      console.error('🔴 [Redis] Error in connection:', err.message);
    });

    redisConnection.on('connect', () => {
      console.log('🔌 [Redis] Connected successfully.');
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
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
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
        throw err;
      }
    },
    {
      connection,
      concurrency: 1, // Serialized execution to prevent race conditions
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

/**
 * Gracefully shuts down workers, queues, and connection poolers.
 */
async function closeQueueAndWorkers() {
  console.log('🔌 [BullMQ] Shutting down queues and workers...');
  if (wheelWorker) {
    await wheelWorker.close();
    console.log('🔌 [BullMQ] Worker terminated.');
  }
  if (wheelQueue) {
    await wheelQueue.close();
    console.log('🔌 [BullMQ] Queue manager terminated.');
  }
  if (redisConnection) {
    redisConnection.disconnect();
    console.log('🔌 [Redis] Connection pool disconnected.');
  }
}

module.exports = {
  getRedisConnection,
  initQueue,
  getQueue,
  initWorker,
  closeQueueAndWorkers,
};
