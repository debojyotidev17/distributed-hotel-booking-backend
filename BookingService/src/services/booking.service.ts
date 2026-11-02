import { v4 as uuidv4 } from "uuid";

import logger from "../config/logger.config.js";
import type {
    CreateBookingRecordDTO,
    CreateDemoBookingRequestDTO,
} from "../dtos/create-demo-booking.dto.js";
import { createRoomHold, releaseRoomHold } from "../apis/hotel-service.api.js";
import { createBookingWithIdempotencyKey } from "../repositories/booking.repository.js";

// Creates a pending booking after HotelService successfully holds the rooms.
export async function createDemoBookingService(
    params: CreateDemoBookingRequestDTO,
) {
    // Generate the ID before requesting the room hold so both services use it.
    const bookingId = uuidv4();

    // Ask HotelService to hold the requested rooms.
    // If this fails, no booking record is created in BookingService.
    const roomHold = await createRoomHold(bookingId, params);

    // Calculate the number of nights, excluding the checkout date.
    const checkIn = new Date(`${params.checkIn}T00:00:00Z`);
    const checkOut = new Date(`${params.checkOut}T00:00:00Z`);
    const nights =
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate the total from HotelService's price, not a client-provided amount.
    const bookingAmount = roomHold.pricePerNight * params.roomCount * nights;

    // The room hold expires after 10 minutes.
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Generate the key the client will use to confirm this booking.
    const idempotencyKey = uuidv4();

    const bookingData: CreateBookingRecordDTO = {
        ...params,
        bookingId,
        bookingAmount,
        holdExpiresAt,
    };

    try {
        // Save the booking and its idempotency key atomically.
        const result = await createBookingWithIdempotencyKey(
            bookingData,
            idempotencyKey,
        );

        logger.info("Pending booking created successfully", {
            bookingId,
            bookingAmount,
            idempotencyKey,
        });

        return {
            ...result.booking,
            idempotencyKey: result.keyRecord.idempotencyKey,
            physicalRoomIds: roomHold.physicalRoomIds,
        };
    } catch (error) {
        // Release the rooms if saving the booking failed.
        try {
            await releaseRoomHold(bookingId);
        } catch (releaseError) {
            logger.error(
                "Failed to release room hold after booking creation failed",
                {
                    bookingId,
                    releaseError,
                },
            );
        }

        // Preserve the original booking creation error.
        throw error;
    }
}
