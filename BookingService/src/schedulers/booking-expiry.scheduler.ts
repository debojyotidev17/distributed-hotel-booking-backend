import logger from "../config/logger.config.js";
import { releaseRoomHold } from "../apis/hotel-service.api.js";
import { expirePendingBookings } from "../repositories/idempotency-key.repository.js";

const EXPIRY_CHECK_INTERVAL = 60 * 1000; // Check every minute.

export function startBookingExpiryScheduler() {
    setInterval(async () => {
        try {
            const expiredBookingIds = await expirePendingBookings();

            for (const bookingId of expiredBookingIds) {
                try {
                    await releaseRoomHold(bookingId);
                    logger.info("Expired booking room hold released", {
                        bookingId,
                    });
                } catch (error) {
                    logger.error(
                        "Failed to release expired booking room hold",
                        {
                            bookingId,
                            error,
                        },
                    );
                }
            }
        } catch (error) {
            logger.error("Booking expiry task failed", { error });
        }
    }, EXPIRY_CHECK_INTERVAL);

    logger.info("Booking expiry scheduler started");
}
