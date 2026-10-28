import { and,  gte, inArray, lt } from "drizzle-orm";

import db from "../models/index.js";
import { rooms } from "../models/schemas/room-availability.schema.js";
import type { RoomAvailabilityInsertDto } from "../dtos/room-availability.dto.js";

// Finds existing availability rows for the selected rooms and date range.
export async function findExistingRoomAvailability(
    physicalRoomIds: string[],
    startDate: string,
    endDate: string,
) {
    return db
        .select()
        .from(rooms)
        .where(
            and(
                inArray(rooms.physicalRoomId, physicalRoomIds),
                gte(rooms.dateOfAvailability, startDate),
                lt(rooms.dateOfAvailability, endDate),
            ),
        );
}

// Inserts missing room-and-date rows and skips duplicates.
export async function bulkCreateRoomAvailability(
    records: RoomAvailabilityInsertDto[],
) {
    return db
        .insert(rooms)
        .values(records)
        .onConflictDoNothing({
            target: [rooms.physicalRoomId, rooms.dateOfAvailability],
        })
        .returning();
}