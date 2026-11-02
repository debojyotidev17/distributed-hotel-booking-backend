import "dotenv/config";
import type { RedisOptions } from "ioredis";

export const redisConnection: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null,
};
