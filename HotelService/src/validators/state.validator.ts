import { z } from "zod";

// Validates a state's name, unique code, and state or union-territory type.
export const createStateSchema = z.object({
    name: z.string().trim().min(1).max(100),
    code: z.string().trim().toUpperCase().min(2).max(3),
    type: z.enum(["STATE", "UNION_TERRITORY"]),
});

// Allows partial state updates and rejects an empty body.
export const updateStateSchema = createStateSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "at least one field must be provided for an update",
    });

// Validates a state UUID in a route parameter.
export const stateIdSchema = z.object({
    id: z.uuid("invalid state id"),
});
