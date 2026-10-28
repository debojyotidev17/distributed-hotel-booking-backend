import { and, eq, gt, lt } from "drizzle-orm";

import db from "../models/index.js";
import { availabilityPeriods } from "../models/schemas/availability-period.schema.js";

// Finds periods for this category that overlap the proposed date range.
export async function findOverlappingAvailabilityPeriods(
    roomCategoryId: string,
    startDate: string,
    endDate: string,
) {
    return db
        .select()
        .from(availabilityPeriods)
        .where(
            and(
                eq(availabilityPeriods.roomCategoryId, roomCategoryId),
                lt(availabilityPeriods.startDate, endDate),
                gt(availabilityPeriods.endDate, startDate),
            ),
        );
}

// Saves a batch of periods for one room category.
export async function createAvailabilityPeriods(
    records: Array<{
        roomCategoryId: string;
        startDate: string;
        endDate: string;
        roomsPerNight: number;
    }>,
) {
    return db.insert(availabilityPeriods).values(records).returning();
}

// Lists all periods saved for one room category.
export async function findAvailabilityPeriodsByCategory(
    roomCategoryId: string,
) {
    return db
        .select()
        .from(availabilityPeriods)
        .where(eq(availabilityPeriods.roomCategoryId, roomCategoryId));
}

// Finds periods that overlap a scheduler's date window.
export async function findAvailabilityPeriodsForDateRange(
    startDate: string,
    endDate: string,
) {
    return db
        .select()
        .from(availabilityPeriods)
        .where(
            and(
                lt(availabilityPeriods.startDate, endDate),
                gt(availabilityPeriods.endDate, startDate),
            ),
        );
}

// Finds a saved availability period by its ID.
export async function findAvailabilityPeriodById(id: string) {
    const [period] = await db
        .select()
        .from(availabilityPeriods)
        .where(eq(availabilityPeriods.id, id))
        .limit(1);

    return period ?? null;
}