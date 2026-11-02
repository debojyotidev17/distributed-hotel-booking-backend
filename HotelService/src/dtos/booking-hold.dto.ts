import { z } from "zod";

import { createRoomHoldSchema,releaseRoomHoldParamsSchema } from "../validators/booking-hold.validator.js";

// Represents a validated request from BookingService to hold rooms.
export type CreateRoomHoldDto = z.infer<typeof createRoomHoldSchema>;

export type ReleaseRoomHoldParamsDTO = z.infer<
    typeof releaseRoomHoldParamsSchema
>;
