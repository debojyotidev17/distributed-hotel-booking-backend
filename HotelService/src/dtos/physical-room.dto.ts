import { z } from "zod";

import { roomCategoryParamsSchema } from "../validators/room-category.validator.js";
import { createPhysicalRoomsSchema } from "../validators/physical-room.validator.js";

export type PhysicalRoomParamsDto = z.infer<typeof roomCategoryParamsSchema>;

export type CreatePhysicalRoomsDto = z.infer<typeof createPhysicalRoomsSchema>;
