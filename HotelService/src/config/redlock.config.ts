import Redlock from "redlock";
import redis from "./redis.config.js";

const redlock = new Redlock(
    [redis as unknown as Redlock.CompatibleRedisClient],
    {
        retryCount: 0,
        // retryCount: 0 means a request won't repeatedly wait for a room lock. If another request already holds the lock, this request can return a conflict and the client can retry.
    },
);

export default redlock;
