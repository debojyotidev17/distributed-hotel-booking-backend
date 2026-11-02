import { z } from "zod";

import { roomTypeValues } from "../constants/room-type.constant.js";

export const roomCategoryHotelIdSchema = z.object({
    hotelId: z.uuid("invalid hotel id"),
});

export const roomCategoryParamsSchema = z.object({
    hotelId: z.uuid("invalid hotel id"),
    roomCategoryId: z.uuid("invalid room category id"),
});

export const createRoomCategorySchema = z.object({
    roomType: z.enum(roomTypeValues),
    price: z.number().int().positive(),
});

export const updateRoomCategorySchema = createRoomCategorySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "provide at least one field to update",
    });
