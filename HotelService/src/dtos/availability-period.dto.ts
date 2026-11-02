import { z } from "zod";

import {
    availabilityCategoryParamsSchema,
    createAvailabilityPeriodsSchema,
} from "../validators/availability-period.validator.js";

// Represents the IDs from a nested hotel and room-category route.
export type AvailabilityCategoryParamsDto = z.infer<
    typeof availabilityCategoryParamsSchema
>;

// Represents validated availability periods submitted for creation.
export type CreateAvailabilityPeriodsDto = z.infer<
    typeof createAvailabilityPeriodsSchema
>;