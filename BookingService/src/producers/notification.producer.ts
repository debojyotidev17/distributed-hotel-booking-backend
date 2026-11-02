import logger from "../config/logger.config.js";
import { BOOKING_CONFIRMATION_JOB } from "../constants/queue.constants.js";
import type { NotificationDTO } from "../dtos/notification.dto.js";
import { notificationQueue } from "../queues/notification.queue.js";

// Adds a notification job to the queue.
export async function queueBookingConfirmationNotification(
    params: NotificationDTO,
) {
    await notificationQueue.add(BOOKING_CONFIRMATION_JOB, params, {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: true,
    });

    logger.info("Notification job queued", {
        recipient: params.to,
        templateId: params.templateId,
    });
}
