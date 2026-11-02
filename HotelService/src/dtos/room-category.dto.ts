import { z } from "zod";

import {
    createRoomCategorySchema,
    roomCategoryHotelIdSchema,
    roomCategoryParamsSchema,
    updateRoomCategorySchema,
} from "../validators/room-category.validator.js";

// Represents the hotel ID from a nested route.
export type RoomCategoryHotelIdDto = z.infer<
    typeof roomCategoryHotelIdSchema
>["hotelId"];

// Represents both IDs from a nested route.
export type RoomCategoryParamsDto = z.infer<typeof roomCategoryParamsSchema>;

// Represents validated room-category data for creation.
export type CreateRoomCategoryDto = z.infer<typeof createRoomCategorySchema>;

// Represents validated room-category fields for an update.
export type UpdateRoomCategoryDto = z.infer<typeof updateRoomCategorySchema>;
