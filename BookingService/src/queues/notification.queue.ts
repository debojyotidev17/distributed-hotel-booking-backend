import { Queue } from "bullmq";
import redis from "../config/redis.config.js";
import { BOOKING_NOTIFICATION_QUEUE } from "../constants/queue.constants.js";

export const notificationQueue = new Queue(BOOKING_NOTIFICATION_QUEUE, {
    connection: redis,
});
