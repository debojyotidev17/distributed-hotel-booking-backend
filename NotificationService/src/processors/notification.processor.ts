import { Worker } from "bullmq";
import logger from "../config/logger.config.js";
import { redisConnection } from "../config/redis.config.js";
import {
    BOOKING_NOTIFICATION_QUEUE,
    BOOKING_CONFIRMATION_JOB,
} from "../constants/queue.constants.js";
import type { NotificationDTO } from "../dtos/notification.dto.js";
import { renderMailTemplate } from "../templates/templates.handler.js";
import { sendEmail } from "../services/email.service.js";

export const notificationWorker = new Worker<NotificationDTO>(
    BOOKING_NOTIFICATION_QUEUE,
    async (job) => {
        if (job.name !== BOOKING_CONFIRMATION_JOB) {
            throw new Error(`Unknown notification job: ${job.name}`);
        }

        const notification = job.data;

        const html = await renderMailTemplate(
            notification.templateId,
            notification.params,
        );

        await sendEmail(notification.to, notification.subject, html);

        logger.info("Notification email sent", {
            recipient: notification.to,
            templateId: notification.templateId,
        });
    },
    {
        connection: redisConnection,
    },
);

notificationWorker.on("failed", (job, error) => {
    logger.error("Notification job failed", {
        jobId: job?.id,
        error: error.message,
    });
});
