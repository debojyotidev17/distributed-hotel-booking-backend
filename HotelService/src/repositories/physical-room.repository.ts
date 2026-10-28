import { and, eq, inArray, asc } from "drizzle-orm";

import db from "../models/index.js";
import { physicalRooms } from "../models/schemas/physical-room.schema.js";
import type {
    CreatePhysicalRoomsDto,
    PhysicalRoomParamsDto,
} from "../dtos/physical-room.dto.js";

// Lists a category's physical rooms in a consistent order.
export async function findPhysicalRoomsByCategory(roomCategoryId: string) {
    return db
        .select()
        .from(physicalRooms)
        .where(eq(physicalRooms.roomCategoryId, roomCategoryId))
        .orderBy(asc(physicalRooms.roomNumber));
}

/**
[
{
  "id": "room-uuid-101",
  "roomCategoryId": "category-uuid-123",
  "roomNumber": "101",
  "createdAt": "2026-10-27T09:15:00.000Z",
  "updatedAt": "2026-10-27T09:15:00.000Z"
},
{
  "id": "room-uuid-102",
  "roomCategoryId": "category-uuid-123",
  "roomNumber": "102",
  "createdAt": "2026-10-27T09:16:00.000Z",
  "updatedAt": "2026-10-27T09:16:00.000Z"
}
]
 */

// Finds requested room numbers that are already registered in this category.
// Example: if "101" exists and the input is ["101", "102"], this returns the "101" row.
export async function findExistingPhysicalRooms(
    roomCategoryId: string,
    roomNumbers: string[],
) {
    return db
        .select()
        .from(physicalRooms)
        .where(
            and(
                // Limits the search to the selected room category.
                eq(physicalRooms.roomCategoryId, roomCategoryId),

                // Matches any saved room number from the request list.
                inArray(physicalRooms.roomNumber, roomNumbers),
            ),
        );
}

// Registers physical rooms under the selected category.
export async function createPhysicalRooms(
    params: PhysicalRoomParamsDto,
    data: CreatePhysicalRoomsDto,
) {
    return db
        .insert(physicalRooms)
        .values(
            data.roomNumbers.map((roomNumber) => ({
                roomCategoryId: params.roomCategoryId,
                roomNumber,
            })),
        )
        .returning();
}
