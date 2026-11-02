import logger from "../config/logger.config.js";
import { releaseRoomHold } from "../apis/hotel-service.api.js";
import { finalizeBookingByIdempotencyKey } from "../repositories/idempotency-key.repository.js";
import { queueBookingConfirmationNotification } from "../producers/notification.producer.js";

// Confirms a pending booking using its idempotency key.
export async function confirmBookingService(idempotencyKey: string) {
    const result = await finalizeBookingByIdempotencyKey(idempotencyKey);

    if (result.outcome === "EXPIRED" && result.booking) {
        try {
            await releaseRoomHold(result.booking.id);

            logger.info("Expired booking room hold released", {
                bookingId: result.booking.id,
            });
        } catch (error) {
            logger.error("Failed to release expired booking room hold", {
                bookingId: result.booking.id,
                error,
            });

            throw error;
        }
    }

    // Queue a notification only when the booking is newly confirmed.
    if (result.outcome === "CONFIRMED" && result.booking) {
        try {
            await queueBookingConfirmationNotification({
                to: result.booking.customerEmail,
                subject: "Your booking is confirmed",
                templateId: "booking-confirmation",
                params: {
                    appName: "bookingdotcom",
                    bookingId: result.booking.id,
                    bookingAmount: result.booking.bookingAmount,
                },
            });
        } catch (error) {
            // The booking is already confirmed, so notification failure should not undo it.
            logger.error("Failed to queue booking confirmation notification", {
                bookingId: result.booking.id,
                error,
            });
        }
    }

    logger.info("Booking confirmation processed", {
        idempotencyKey,
        outcome: result.outcome,
    });

    return result;
}
