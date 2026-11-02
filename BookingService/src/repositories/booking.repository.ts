import { eq } from "drizzle-orm";

import type { CreateBookingRecordDTO } from "../dtos/create-demo-booking.dto.js";
import db from "../models/index.js";
import { bookings } from "../models/schemas/booking.schema.js";
import { idempotencyKeys } from "../models/schemas/idempotency-key.schema.js";

// Saves a pending booking and its key together after HotelService holds the rooms.
export async function createBookingWithIdempotencyKey(
    bookingData: CreateBookingRecordDTO,
    idempotencyKey: string,
) {
    return db.transaction(async (tx) => {
        const { bookingId, ...bookingFields } = bookingData;

        // Save the booking with the ID already used by HotelService for its room hold.
        const [booking] = await tx
            .insert(bookings)
            .values({
                id: bookingId,
                ...bookingFields,
            })
            .returning();

        // Save the key that the client will use to confirm this booking.
        const [keyRecord] = await tx
            .insert(idempotencyKeys)
            .values({
                bookingId: booking.id,
                idempotencyKey,
            })
            .returning();

        return { booking, keyRecord };
    });
}

// Finds a booking by its ID, or returns null if it doesn't exist.
export async function findBookingById(bookingId: string) {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    return booking ?? null;
}
