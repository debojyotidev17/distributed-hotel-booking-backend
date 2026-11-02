import { z } from "zod";

// Validates one period and requires the end date to follow the start date.
const availabilityPeriodSchema = z
    .object({
        startDate: z.iso.date(),
        endDate: z.iso.date(),
        roomsPerNight: z.number().int().positive(),
    })
    .refine((period) => period.startDate < period.endDate, {
        message: "endDate must be after startDate",
        path: ["endDate"],
    });

// Validates a batch of periods submitted for one category.
export const createAvailabilityPeriodsSchema = z.object({
    periods: z.array(availabilityPeriodSchema).min(1),
});

/**
{
"periods": [
        {
            "startDate": "2026-11-01",
            "endDate": "2026-11-05",
            "roomsPerNight": 5
        },
        {
            "startDate": "2026-11-05",
            "endDate": "2026-11-10",
            "roomsPerNight": 8
        }
    ]
}
*/

// Validates the IDs in a nested hotel and room-category route.
export const availabilityCategoryParamsSchema = z.object({
    hotelId: z.uuid("invalid hotel id"),
    roomCategoryId: z.uuid("invalid room category id"),
});
