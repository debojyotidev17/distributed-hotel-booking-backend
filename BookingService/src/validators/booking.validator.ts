import { z } from "zod";

// Validates the details the customer sends to start a demo booking.
export const createDemoBookingSchema = z
    .object({
        // Customer's email address for booking notifications.
        customerEmail: z.email().trim().toLowerCase(),

        // HotelService uses UUIDs for hotels.
        hotelId: z.uuid(),

        // Identifies the room category; HotelService will choose the physical rooms.
        roomCategoryId: z.uuid(),

        // Dates must use the YYYY-MM-DD format.
        checkIn: z.iso.date(),
        checkOut: z.iso.date(),

        // How many rooms the customer wants; must be a positive whole number.
        roomCount: z.number().int().positive(),
    })
    // A stay must end after it starts. ISO dates can be compared in this format.
    .refine((data) => data.checkIn < data.checkOut, {
        message: "checkOut must be after checkIn",
        path: ["checkOut"],
    });

export const confirmBookingParamsSchema = z.object({
    idempotencyKey: z.uuid(),
});
