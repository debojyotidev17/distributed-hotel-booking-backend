import logger from "../config/logger.config.js";
import type { RoomAvailabilityInsertDto } from "../dtos/room-availability.dto.js";
import type { RoomGenerationJobDto } from "../dtos/room-generation.dto.js";
import { findAvailabilityPeriodById } from "../repositories/availability-period.repository.js";
import { findPhysicalRoomsByCategory } from "../repositories/physical-room.repository.js";
import {
    bulkCreateRoomAvailability,
    findExistingRoomAvailability,
} from "../repositories/room-availability.repository.js";
import { findRoomCategoryByIdOnly } from "../repositories/room-category.repository.js";
import { BadRequestError } from "../utils/errors/app.error.js";
import {
    addDaysToDateString,
    getIndiaBookingWindow,
} from "../utils/helpers/date.helper.js";

/** Generates missing room-availability records for a queued job within the current booking window. */
export async function generateRoomAvailability(job: RoomGenerationJobDto) {
    // Fetch the saved period to get its dates, room category, and room count.
    const period = await findAvailabilityPeriodById(job.availabilityPeriodId);

    // Skip the job if its availability period was deleted after the job was queued.
    if (!period) {
        logger.warn("Availability period no longer exists; generation skipped");
        return { totalDatesProcessed: 0, totalRoomsCreated: 0 };
    }

    // Fetch the category to get details such as the room price.
    const category = await findRoomCategoryByIdOnly(period.roomCategoryId);

    // Skip generation if the room category no longer exists.
    if (!category) {
        logger.warn("Room category no longer exists; generation skipped");
        return { totalDatesProcessed: 0, totalRoomsCreated: 0 };
    }

    // Ensure the job has a valid date range that stays within the saved period.
    if (
        job.startDate >= job.endDate ||
        job.startDate < period.startDate ||
        job.endDate > period.endDate
    ) {
        throw new BadRequestError(
            "Generation job dates are outside the period",
        );
    }

    // Get today's date and the current booking-window end date in India.
    const { today, endDate: bookingWindowEnd } = getIndiaBookingWindow();

    // Start from the latest of the job start, period start, and today.
    const startDate = [job.startDate, period.startDate, today].reduce(
        (latest, date) => (date > latest ? date : latest),
    );

    // End at the earliest of the job end, period end, and booking-window end.
    const endDate = [job.endDate, period.endDate, bookingWindowEnd].reduce(
        (earliest, date) => (date < earliest ? date : earliest),
    );

    // Skip the job if no eligible dates remain after trimming the range.
    if (startDate >= endDate) {
        return { totalDatesProcessed: 0, totalRoomsCreated: 0 };
    }

    // Fetch the physical rooms in this category; the repository sorts them by room number.
    const physicalRooms = await findPhysicalRoomsByCategory(
        period.roomCategoryId,
    );

    // The owner cannot offer more rooms per night than physically exist in the category.
    if (period.roomsPerNight > physicalRooms.length) {
        throw new BadRequestError(
            `The period offers ${period.roomsPerNight} rooms, but the category has only ${physicalRooms.length}`,
        );
    }

    // Select the first N rooms; this does not dynamically choose whichever rooms are free.
    const selectedRooms = physicalRooms.slice(0, period.roomsPerNight);

    // Fetch existing availability records for the selected rooms and eligible dates.
    const existingRooms = await findExistingRoomAvailability(
        selectedRooms.map((room) => room.id),
        startDate,
        endDate,
    );

    // Store existing room-and-date combinations for quick lookups, e.g. "room-101:2026-11-01".
    const existingRoomDates = new Set(
        existingRooms.map(
            (room) => `${room.physicalRoomId}:${room.dateOfAvailability}`,
        ),
    );

    // Collect missing records so they can be inserted in one bulk database operation.
    const recordsToCreate: RoomAvailabilityInsertDto[] = [];
    let currentDate = startDate;
    let totalDatesProcessed = 0;

    // Process each date; the end date is exclusive, so it is not processed.
    while (currentDate < endDate) {
        // Check each selected physical room for the current date.
        for (const physicalRoom of selectedRooms) {
            const roomDateKey = `${physicalRoom.id}:${currentDate}`;

            // Prepare a record only when this room does not already have availability for the date.
            if (!existingRoomDates.has(roomDateKey)) {
                recordsToCreate.push({
                    physicalRoomId: physicalRoom.id,
                    dateOfAvailability: currentDate,
                    price: category.price,
                });
            }
        }

        // Count each processed date once, regardless of how many records were missing.
        totalDatesProcessed += 1;

        // Move to the next calendar date.
        currentDate = addDaysToDateString(currentDate, 1);
    }

    // Skip the insert when no records are missing; the database also ignores duplicate room-date combinations.
    const createdRooms =
        recordsToCreate.length > 0
            ? await bulkCreateRoomAvailability(recordsToCreate)
            : [];

    logger.info(
        `Room availability generated for period ${period.id}: ${createdRooms.length} rows created`,
    );

    // Return the number of dates processed and availability rows actually inserted.
    return {
        totalDatesProcessed,
        totalRoomsCreated: createdRooms.length,
    };
}