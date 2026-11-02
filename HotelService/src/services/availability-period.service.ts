import logger from "../config/logger.config.js";
import type {
    AvailabilityCategoryParamsDto,
    CreateAvailabilityPeriodsDto,
} from "../dtos/availability-period.dto.js";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error.js";
import { addRoomGenerationJobToQueue } from "../producers/room-generation.producer.js";
import {
    createAvailabilityPeriods,
    findAvailabilityPeriodsByCategory,
    findOverlappingAvailabilityPeriods,
} from "../repositories/availability-period.repository.js";
import { findPhysicalRoomsByCategory } from "../repositories/physical-room.repository.js";
import { findRoomCategoryById } from "../repositories/room-category.repository.js";
import { getIndiaBookingWindow } from "../utils/helpers/date.helper.js";

// Saves owner-defined periods and queues generation for dates currently bookable.
export async function createAvailabilityPeriodsService(
    params: AvailabilityCategoryParamsDto,
    data: CreateAvailabilityPeriodsDto,
) {
    // The function checks whether that room category belongs to the specified hotel.
    const category = await findRoomCategoryById(params);

    if (!category) {
        logger.warn("Room category not found for this hotel");
        throw new NotFoundError("Room category not found for this hotel");
    }

    // Get the physical rooms belonging to that category
    const physicalRooms = await findPhysicalRoomsByCategory(
        params.roomCategoryId,
    );

    // Sort the requested availability periods
    // periods contains the availability periods submitted by the hotel owner, sorted by their start dates.
    const periods = [...data.periods].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
    );

    // helper returns today's Indian calendar date and the exclusive end of a three-month booking window.

    // bookingWindowEnd is calculated as three calendar months from today

    /**For our example, assume today is October 27, 2026.

    The returned values are:
    {
        today: "2026-10-27",
        endDate: "2027-01-27"
    } */

    // renames the returned endDate to bookingWindowEnd when destructuring it
    const { today, endDate: bookingWindowEnd } = getIndiaBookingWindow();

    for (let index = 0; index < periods.length; index += 1) {
        const period = periods[index];

        // First check: the period must not start in the past.
        // If today is October 27 and the owner requests a period beginning October 20, the service rejects it.
        if (period.startDate < today) {
            throw new BadRequestError(
                "Availability periods cannot start in the past",
            );
        }

        // Second check: the requested room count cannot exceed the registered rooms.
        if (period.roomsPerNight > physicalRooms.length) {
            throw new BadRequestError(
                `roomsPerNight cannot exceed the ${physicalRooms.length} registered physical rooms`,
            );
        }

        // Third check: periods in the same request must not overlap.
        if (index > 0 && periods[index - 1].endDate > period.startDate) {
            throw new BadRequestError(
                "Availability periods in this request cannot overlap",
            );
        }

        // Fourth check: the period must not overlap an existing period in the database.
        const overlappingPeriods = await findOverlappingAvailabilityPeriods(
            params.roomCategoryId,
            period.startDate,
            period.endDate,
        );

        if (overlappingPeriods.length > 0) {
            throw new BadRequestError(
                "An availability period already exists for these dates",
            );
        }
    }

    // Save the validated availability periods in the database.
    const savedPeriods = await createAvailabilityPeriods(
        periods.map((period) => ({
            roomCategoryId: params.roomCategoryId,
            ...period,
        })),
    );

    /**Suppose periods contains:
     [
         {
             startDate: "2026-11-01",
             endDate: "2026-11-05",
             roomsPerNight: 2,
         },
     ]
     
     
     The .map() method creates a new array in which every period includes the room category ID.
     [
         {
             roomCategoryId: "category-uuid-123",
             startDate: "2026-11-01",
             endDate: "2026-11-05",
             roomsPerNight: 2,
         },
     ] */

    /**The returned records are stored in savedPeriods. They can include generated IDs and timestamps in addition to the original fields.

         For example:
         [
             {
                 id: "period-uuid-456",
                 roomCategoryId: "category-uuid-123",
                 startDate: "2026-11-01",
                 endDate: "2026-11-05",
                 roomsPerNight: 2,
                 // createdAt and updatedAt are also returned
             },
        ] */

    // Queue a job to generate room availability for each saved period.
    for (const period of savedPeriods) {
        const startDate = period.startDate;

        /*
            It compares:
            - The availability period's end date: February 10.
            - The booking window's end date: January 27.
            January 27 is earlier than February 10, so the result is:
            endDate = "2027-01-27";
        */
        const endDate =
            period.endDate < bookingWindowEnd
                ? period.endDate
                : bookingWindowEnd;

        // Queue the job only if the period contains bookable dates.
        // Generate availability only up to the booking-window end date.
        // Any remaining dates will be handled by the scheduler as the window advances.
        if (startDate < endDate) {
            await addRoomGenerationJobToQueue({
                availabilityPeriodId: period.id,
                startDate,
                endDate,
            });
        }
    }

    logger.info(
        `Saved ${savedPeriods.length} availability periods for category ${params.roomCategoryId}`,
    );

    // Return the saved periods to the controller.
    return savedPeriods;
}

// Lists saved periods for a room category belonging to the selected hotel.
export async function getAvailabilityPeriodsService(
    params: AvailabilityCategoryParamsDto,
) {
    const category = await findRoomCategoryById(params);

    if (!category) {
        logger.warn("Room category not found for this hotel");
        throw new NotFoundError("Room category not found for this hotel");
    }

    const periods = await findAvailabilityPeriodsByCategory(
        params.roomCategoryId,
    );

    logger.info("Availability periods retrieved successfully");

    return periods;
}
