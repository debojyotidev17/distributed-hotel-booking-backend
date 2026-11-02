import { z } from "zod";

import {
    createHotelSchema,
    hotelIdSchema,
    updateHotelSchema,
} from "../validators/hotel.validator.js";

// represents the validated request body for creating a hotel
export type CreateHotelDto = z.infer<typeof createHotelSchema>;

// represents the validated request body for updating a hotel
export type UpdateHotelDto = z.infer<typeof updateHotelSchema>;

// represents a validated hotel id
export type HotelIdDto = z.infer<typeof hotelIdSchema>["id"];

// represents hotel data ready to insert after resolving its city name
export type CreateHotelRecordDto = Omit<
    CreateHotelDto,
    "cityName" | "stateName"
> & {
    cityId: string;
};

// represents hotel fields ready to update after resolving any new city name
export type UpdateHotelRecordDto = Partial<
    Omit<CreateHotelRecordDto, "cityId">
> & {
    cityId?: string;
};
