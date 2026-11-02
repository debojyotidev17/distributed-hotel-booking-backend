import { eq } from "drizzle-orm";

import db from "../models/index.js";
import { bookings } from "../models/schemas/booking.schema.js";
import { idempotencyKeys } from "../models/schemas/idempotency-key.schema.js";

// Locks and finalizes a booking using its idempotency key.
export async function finalizeBookingByIdempotencyKey(idempotencyKey: string) {
    return db.transaction(async (tx) => {
        // Lock the key so concurrent confirmation requests are handled one at a time.
        const [keyRecord] = await tx
            .select()
            .from(idempotencyKeys)
            .where(eq(idempotencyKeys.idempotencyKey, idempotencyKey))
            .for("update")
            .limit(1);

        if (!keyRecord) {
            return { outcome: "NOT_FOUND" as const };
        }

        // Lock the associated booking while checking and changing its status.
        const [booking] = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.id, keyRecord.bookingId))
            .for("update")
            .limit(1);

        if (!booking) {
            return { outcome: "BOOKING_NOT_FOUND" as const };
        }

        const now = new Date();

        // A repeated confirmation returns the existing booking result.
        if (
            keyRecord.status === "FINALIZED" ||
            booking.status === "CONFIRMED"
        ) {
            return {
                outcome: "ALREADY_FINALIZED" as const,
                booking,
            };
        }

        // An expired key or hold cannot be used to confirm the booking.
        if (
            keyRecord.status === "EXPIRED" ||
            booking.status === "CANCELLED" ||
            booking.holdExpiresAt <= now
        ) {
            let expiredBooking = booking;

            if (booking.status === "PENDING") {
                const [cancelledBooking] = await tx
                    .update(bookings)
                    .set({
                        status: "CANCELLED",
                        updatedAt: now,
                    })
                    .where(eq(bookings.id, booking.id))
                    .returning();

                expiredBooking = cancelledBooking ?? booking;
            }

            if (keyRecord.status === "ACTIVE") {
                await tx
                    .update(idempotencyKeys)
                    .set({
                        status: "EXPIRED",
                        updatedAt: now,
                    })
                    .where(eq(idempotencyKeys.id, keyRecord.id));
            }

            return {
                outcome: "EXPIRED" as const,
                booking: expiredBooking,
            };
        }

        // Only an active key can confirm a pending booking.
        if (keyRecord.status !== "ACTIVE" || booking.status !== "PENDING") {
            return {
                outcome: "NOT_PENDING" as const,
                booking,
            };
        }

        const [confirmedBooking] = await tx
            .update(bookings)
            .set({
                status: "CONFIRMED",
                updatedAt: now,
            })
            .where(eq(bookings.id, booking.id))
            .returning();

        await tx
            .update(idempotencyKeys)
            .set({
                status: "FINALIZED",
                updatedAt: now,
            })
            .where(eq(idempotencyKeys.id, keyRecord.id));

        return {
            outcome: "CONFIRMED" as const,
            booking: confirmedBooking,
        };
    });
}


/**
 * Cancels pending bookings whose room holds have expired
 * and marks their idempotency keys as expired.
 */
export async function expirePendingBookings() {
    const now = new Date();

    return db.transaction(async (tx) => {
        const pendingBookings = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.status, "PENDING"));

        const expiredBookings = pendingBookings.filter(
            (booking) => booking.holdExpiresAt <= now,
        );

        for (const booking of expiredBookings) {
            await tx
                .update(bookings)
                .set({
                    status: "CANCELLED",
                    updatedAt: now,
                })
                .where(eq(bookings.id, booking.id));

            await tx
                .update(idempotencyKeys)
                .set({
                    status: "EXPIRED",
                    updatedAt: now,
                })
                .where(eq(idempotencyKeys.bookingId, booking.id));
        }

        return expiredBookings.map((booking) => booking.id);
    });
}
