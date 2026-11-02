import { z } from "zod";

export const roomHoldResponseSchema = z.object({
    pricePerNight: z.number(),
    physicalRoomIds: z.array(z.string().uuid()),
});
