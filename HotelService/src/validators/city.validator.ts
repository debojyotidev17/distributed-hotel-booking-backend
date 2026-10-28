import { z } from "zod";

// Validates the name and parent state for a new city.
export const createCitySchema = z.object({
    name: z.string().trim().min(1).max(100),
    stateId: z.uuid("invalid state id"),
});

// Allows partial city updates and rejects an empty body.
export const updateCitySchema = createCitySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "at least one field must be provided for an update",
    });

// Validates a city UUID used by a route.
export const cityIdSchema = z.object({
    id: z.uuid("invalid city id"),
});

// Validates the optional state filter in GET /cities?stateId=<uuid>.
export const listCitiesQuerySchema = z.object({
    stateId: z.uuid("invalid state id").optional(),
});
