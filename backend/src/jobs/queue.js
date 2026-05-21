const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { redisUrl } = require('../config');

let queueConnection = null;
let workerConnection = null;
let wheelQueue = null;
let wheelWorker = null;

/**
 * Create a new Redis connection with standard config.
 * BullMQ requires separate connections for Queue and Worker.
 */
function createRedisConnection(label) {
  const conn = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  conn.on('error', (err) => {
    console.error(`🔴 [Redis:${label}] Error:`, err.message);
  });

  conn.on('connect', () => {
    console.log(`🔌 [Redis:${label}] Connected successfully.`);
  });

  return conn;
}

function getQueueConnection() {
  if (!queueConnection) {
    queueConnection = createRedisConnection('Queue');
  }
  return queueConnection;
}

function getWorkerConnection() {
  if (!workerConnection) {
    workerConnection = createRedisConnection('Worker');
  }
  return workerConnection;
}

function initQueue() {
  const connection = getQueueConnection();
  
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
  const connection = getWorkerConnection();

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
      stalledInterval: 30000, // Check for stalled jobs every 30s
      lockDuration: 60000, // Lock jobs for 60s to prevent duplicate processing
    }
  );

  wheelWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} [${job.name}] completed`);
  });

  wheelWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job.id} [${job.name}] failed:`, err.message);
  });

  wheelWorker.on('error', (err) => {
    console.error('[BullMQ] Worker error:', err.message);
  });

  wheelWorker.on('stalled', (jobId) => {
    console.warn(`[BullMQ] Job ${jobId} stalled and will be re-processed`);
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
  if (workerConnection) {
    workerConnection.disconnect();
    console.log('🔌 [Redis:Worker] Disconnected.');
  }
  if (queueConnection) {
    queueConnection.disconnect();
    console.log('🔌 [Redis:Queue] Disconnected.');
  }
}

module.exports = {
  initQueue,
  getQueue,
  initWorker,
  closeQueueAndWorkers,
};
