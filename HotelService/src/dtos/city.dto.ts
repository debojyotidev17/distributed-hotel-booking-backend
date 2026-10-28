import { z } from "zod";
import {
    cityIdSchema,
    createCitySchema,
    listCitiesQuerySchema,
    updateCitySchema,
} from "../validators/city.validator.js";

// Represents validated input for creating a city.
export type CreateCityDto = z.infer<typeof createCitySchema>;

// Represents validated fields for updating a city.
export type UpdateCityDto = z.infer<typeof updateCitySchema>;

// Represents a validated city UUID.
export type CityIdDto = z.infer<typeof cityIdSchema>["id"];

// Represents the optional state filter for listing cities.
export type ListCitiesQueryDto = z.infer<typeof listCitiesQuerySchema>;