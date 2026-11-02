import { z } from "zod";

// Validates the saved period and date range a generation job should process.
export const roomGenerationJobSchema = z
    .object({
        availabilityPeriodId: z.uuid("invalid availability period id"),
        startDate: z.iso.date(),
        endDate: z.iso.date(),
    })
    .refine((job) => job.startDate < job.endDate, {
        message: "endDate must be after startDate",
        path: ["endDate"],
    });
