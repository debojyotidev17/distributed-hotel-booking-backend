import { z } from "zod";

// Validates a request from BookingService to hold rooms for a booking.
export const createRoomHoldSchema = z
    .object({
        bookingId: z.uuid("Invalid booking ID"),
        roomCategoryId: z.uuid("Invalid room category ID"),
        startDate: z.iso.date(),
        endDate: z.iso.date(),
        roomsRequired: z.number().int().positive(),
    })
    .refine((request) => request.startDate < request.endDate, {
        message: "endDate must be after startDate",
        path: ["endDate"],
    });

export const releaseRoomHoldParamsSchema = z.object({
    bookingId: z.uuid(),
});