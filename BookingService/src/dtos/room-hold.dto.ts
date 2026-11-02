import { z } from "zod";
import { roomHoldResponseSchema } from "../validators/room-hold.validator.js"

export type RoomHoldResponse = z.infer<typeof roomHoldResponseSchema>;