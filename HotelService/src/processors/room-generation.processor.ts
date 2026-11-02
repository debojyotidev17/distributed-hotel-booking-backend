import { Worker } from "bullmq";

import logger from "../config/logger.config.js";
import redis from "../config/redis.config.js";
import { ROOM_GENERATION_QUEUE_NAME } from "../constants/queue-name.constant.js";
import { generateRoomAvailability } from "../services/room-generation.service.js";

async function setupRoomGenerationWorker() {
    const roomGenerationWorker = new Worker(
        ROOM_GENERATION_QUEUE_NAME,
        async (job) => {
            logger.info(`Processing room-generation job ${job.id}`);

            return generateRoomAvailability(job.data);
        },
        {
            connection: redis,

            // Processes one job at a time in this worker instance.
            concurrency: 1,
        },
    );

    // Log jobs that complete successfully.
    roomGenerationWorker.on("completed", (job, result) => {
        logger.info(
            `Room-generation job ${job.id} completed: ${result.totalRoomsCreated} rows created`,
        );
    });

    // Log job failures; BullMQ may retry the job depending on its configuration.
    roomGenerationWorker.on("failed", (job, error) => {
        logger.error(
            `Room-generation job ${job?.id ?? "unknown"} failed: ${error.message}`,
        );
    });

    // Log errors emitted by the worker itself.
    roomGenerationWorker.on("error", (error) => {
        logger.error(`Room-generation worker error: ${error.message}`);
    });
}

// Start the room-generation worker.
export async function startWorkers() {
    await setupRoomGenerationWorker();
}