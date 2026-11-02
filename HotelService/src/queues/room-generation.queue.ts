import { Queue } from "bullmq";
import { ROOM_GENERATION_QUEUE_NAME } from "../constants/queue-name.constant.js";

import redis from "../config/redis.config.js";

export const roomGenerationQueue = new Queue(ROOM_GENERATION_QUEUE_NAME, {
    connection: redis,

    // Default options applied to every job added to this queue.
    defaultJobOptions: {
        // Retry a job up to 3 attempts if its processing fails.
        attempts: 3,

        // Configure the delay between failed attempts.
        backoff: {
            // Increase the retry delay after each failed attempt.
            type: "exponential",

            // Start with a 2-second delay before the first retry.
            delay: 2000,
        },
    },
});