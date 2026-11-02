import { z } from "zod";
import {
    createDemoBookingSchema,
    confirmBookingParamsSchema,
} from "../validators/booking.validator.js";

// Type for the fields validated in the client's request body.
export type CreateDemoBookingRequestDTO = z.infer<
    typeof createDemoBookingSchema
>;

export type CreateBookingRecordDTO = CreateDemoBookingRequestDTO & {
    bookingId: string;
    bookingAmount: number;
    holdExpiresAt: Date;
};
export type ConfirmBookingParamsDTO = z.infer<
    typeof confirmBookingParamsSchema
>;