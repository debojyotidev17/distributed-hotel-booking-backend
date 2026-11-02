import { and, asc, eq, gte, inArray, isNull, lt } from "drizzle-orm";

import db from "../models/index.js";
import { physicalRooms } from "../models/schemas/physical-room.schema.js";
import { rooms } from "../models/schemas/room-availability.schema.js";
import type { CreateRoomHoldDto } from "../dtos/booking-hold.dto.js";

// Finds physical rooms that appear available for every night of the stay.
// This is only a preliminary check; availability is verified again before reserving.
export async function findCandidateRooms(params: CreateRoomHoldDto) {
    const availabilityRows = await db
        .select({
            physicalRoomId: rooms.physicalRoomId,
            dateOfAvailability: rooms.dateOfAvailability,
        })
        .from(rooms)
        .innerJoin(physicalRooms, eq(rooms.physicalRoomId, physicalRooms.id))
        .where(
            and(
                eq(physicalRooms.roomCategoryId, params.roomCategoryId),
                gte(rooms.dateOfAvailability, params.startDate),
                lt(rooms.dateOfAvailability, params.endDate),
                isNull(rooms.bookingId),
            ),
        )
        .orderBy(asc(rooms.physicalRoomId), asc(rooms.dateOfAvailability));

    // Group available dates by physical room.
    const availableDatesByRoom = new Map<string, Set<string>>();

    for (const row of availabilityRows) {
        const dates =
            availableDatesByRoom.get(row.physicalRoomId) ?? new Set<string>();

        dates.add(row.dateOfAvailability);
        availableDatesByRoom.set(row.physicalRoomId, dates);
    }

    // Checkout date is exclusive, so count only the nights being booked.
    const start = new Date(`${params.startDate}T00:00:00Z`);
    const end = new Date(`${params.endDate}T00:00:00Z`);
    const nightsRequired =
        (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);

    // Return only rooms available for every night of the stay.
    return [...availableDatesByRoom.entries()]
        .filter(([, dates]) => dates.size === nightsRequired)
        .slice(0, params.roomsRequired)
        .map(([physicalRoomId]) => physicalRoomId);
}

// Rechecks and reserves the selected rooms in one database transaction.
// Returns false if any selected room is no longer available.
export async function reserveSelectedRooms(
    bookingId: string,
    physicalRoomIds: string[],
    startDate: string,
    endDate: string,
) {
    return db.transaction(async (tx) => {
        // Lock the matching available rows until this transaction finishes.
        const lockedRows = await tx
            .select({
                physicalRoomId: rooms.physicalRoomId,
                dateOfAvailability: rooms.dateOfAvailability,
            })
            .from(rooms)
            .where(
                and(
                    inArray(rooms.physicalRoomId, physicalRoomIds),
                    gte(rooms.dateOfAvailability, startDate),
                    lt(rooms.dateOfAvailability, endDate),
                    isNull(rooms.bookingId),
                ),
            )
            .orderBy(asc(rooms.physicalRoomId), asc(rooms.dateOfAvailability))
            .for("update");

        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T00:00:00Z`);
        const nightsRequired =
            (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);

        // Count the available nights for each selected room.
        const datesByRoom = new Map<string, Set<string>>();

        for (const row of lockedRows) {
            const dates =
                datesByRoom.get(row.physicalRoomId) ?? new Set<string>();

            dates.add(row.dateOfAvailability);
            datesByRoom.set(row.physicalRoomId, dates);
        }

        // Every requested room must still be available for the entire stay.
        const allRoomsAvailable =
            physicalRoomIds.length > 0 &&
            physicalRoomIds.every(
                (roomId) => datesByRoom.get(roomId)?.size === nightsRequired,
            );

        if (!allRoomsAvailable) {
            return false;
        }

        // Reserve every selected room-date row for this booking.
        await tx
            .update(rooms)
            .set({
                bookingId,
                updatedAt: new Date(),
            })
            .where(
                and(
                    inArray(rooms.physicalRoomId, physicalRoomIds),
                    gte(rooms.dateOfAvailability, startDate),
                    lt(rooms.dateOfAvailability, endDate),
                    isNull(rooms.bookingId),
                ),
            );

        return true;
    });
}

// Releases all room availability rows held by this booking.
export async function releaseRoomHold(bookingId: string) {
    const releasedRooms = await db
        .update(rooms)
        .set({
            bookingId: null,
            updatedAt: new Date(),
        })
        .where(eq(rooms.bookingId, bookingId))
        .returning({ id: rooms.id });

    return releasedRooms.length;
}