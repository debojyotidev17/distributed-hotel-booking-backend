import { z } from "zod";

// Reuses hotel and category ID validation for the physical-room route.
export { roomCategoryParamsSchema as physicalRoomParamsSchema } from "./room-category.validator.js";

// Valid example: { roomNumbers: ["101", "102", "A-12"] }
export const createPhysicalRoomsSchema = z.object({
    // Requires the request body to provide a list of room numbers.
    roomNumbers: z
        .array(
            z
                // Trims whitespace and requires each number to be 1–20 characters.
                .string()
                .trim()
                .min(1)
                .max(20),
        )
        // Requires at least one room number.
        .min(1)
        // Rejects duplicate numbers in this request after trimming.
        .refine(
            (roomNumbers) => new Set(roomNumbers).size === roomNumbers.length,
            { message: "room numbers must be unique in the request" },
        ),
});

// Invalid example: { roomNumbers: ["101", " 101 "] } because trimming makes them duplicates.
