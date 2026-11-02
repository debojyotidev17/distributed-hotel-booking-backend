import logger from "../config/logger.config.js";
import redlock from "../config/redlock.config.js";
import type { CreateRoomHoldDto } from "../dtos/booking-hold.dto.js";
import {
    findCandidateRooms,
    reserveSelectedRooms,
    releaseRoomHold,
} from "../repositories/booking-hold.repository.js";
import { findRoomCategoryByIdOnly } from "../repositories/room-category.repository.js";
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "../utils/errors/app.error.js";

export async function createRoomHoldService(params: CreateRoomHoldDto) {
    // Find the room category to get its current price.
    const roomCategory = await findRoomCategoryByIdOnly(params.roomCategoryId);

    if (!roomCategory) {
        throw new NotFoundError("Room category not found");
    }

    // Find rooms that appear available for every requested night.
    const physicalRoomIds = await findCandidateRooms(params);

    // Stop if there aren't enough rooms for the requested booking.
    if (physicalRoomIds.length < params.roomsRequired) {
        throw new BadRequestError(
            "Not enough rooms available for the requested dates",
        );
    }

    // Create one lock resource for each room and date being reserved.
    const lockResources: string[] = [];
    const start = new Date(`${params.startDate}T00:00:00Z`);
    const end = new Date(`${params.endDate}T00:00:00Z`);

    for (const roomId of physicalRoomIds) {
        for (
            const date = new Date(start);
            date < end;
            date.setUTCDate(date.getUTCDate() + 1)
        ) {
            const dateString = date.toISOString().slice(0, 10);
            lockResources.push(`room:${roomId}:${dateString}`);
        }
    }

    // Acquire all requested room-date locks before reserving.
    let lock;

    try {
        lock = await redlock.acquire(lockResources, 5000);
    } catch {
        throw new ConflictError(
            "The selected rooms are being reserved. Please try again.",
        );
    }

    try {
        // Recheck availability and reserve the rooms in a database transaction.
        const roomsReserved = await reserveSelectedRooms(
            params.bookingId,
            physicalRoomIds,
            params.startDate,
            params.endDate,
        );

        // Another request may have reserved the rooms before this transaction.
        if (!roomsReserved) {
            logger.warn("Room availability changed while creating a hold", {
                bookingId: params.bookingId,
            });

            throw new ConflictError(
                "Room availability changed. Please try again.",
            );
        }

        logger.info("Room hold created successfully", {
            bookingId: params.bookingId,
            physicalRoomIds,
            pricePerNight: roomCategory.price,
        });

        return {
            bookingId: params.bookingId,
            physicalRoomIds,
            startDate: params.startDate,
            endDate: params.endDate,
            pricePerNight: roomCategory.price,
        };
    } finally {
        // Release the locks even if the reservation fails.
        await redlock.release(lock);
    }
}

// Releases a room hold when BookingService cannot create the booking.
export async function releaseRoomHoldService(bookingId: string) {
    const releasedCount = await releaseRoomHold(bookingId);

    logger.info("Room hold released", {
        bookingId,
        releasedCount,
    });

    return {
        bookingId,
        releasedCount,
    };
}
