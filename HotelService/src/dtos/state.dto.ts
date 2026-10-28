import { z } from "zod";
import {
    createStateSchema,
    stateIdSchema,
    updateStateSchema,
} from "../validators/state.validator.js";

// Represents validated input for creating a state or union territory.
export type CreateStateDto = z.infer<typeof createStateSchema>;

// Represents validated fields for updating a state or union territory.
export type UpdateStateDto = z.infer<typeof updateStateSchema>;

// Represents a validated state UUID.
export type StateIdDto = z.infer<typeof stateIdSchema>["id"];