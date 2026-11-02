import "dotenv/config";
import logger from "./config/logger.config.js";
import { notificationWorker } from "./processors/notification.processor.js";

notificationWorker.on("ready", () => {
    logger.info("Notification worker is ready");
});

notificationWorker.on("error", (error) => {
    logger.error("Notification worker error", {
        error: error.message,
    });
});

logger.info("NotificationService started");
