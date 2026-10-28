import { z } from "zod";

/*
 * Example create request:
 * { name: "Taj Hotel", address: "Apollo Bunder", cityName: "Mumbai", stateName: "Maharashtra" }
 * The service resolves the city and state names to database IDs.
 */
export const createHotelSchema = z.object({
    // Trims the name and requires 1 to 100 characters.
    name: z
        .string()
        .trim()
        .min(1, "hotel name is required")
        .max(100, "hotel name must be less than 100 characters"),

    // Trims the address and rejects an empty value.
    address: z.string().trim().min(1, "hotel address is required"),

    // Accepts the city name so the owner does not need to know its database ID.
    cityName: z.string().trim().min(1).max(100),

    // Accepts the state name used to find the city.
    stateName: z.string().trim().min(1).max(100),

    // Defaults the hotel's average rating to 0 and limits it to 0 through 5.
    rating: z.number().min(0).max(5).default(0),

    // Defaults the number of ratings to 0 and requires a non-negative whole number.
    ratingCount: z.number().int().nonnegative().default(0),
});

/*
 * Makes every create field optional so an update can change only selected fields.
 * The first refine rejects an empty update body.
 * The second refine allows cityName alone, or cityName and stateName together.
 * With cityName alone, the service uses the hotel's current state to find the city.
 * Include both names when moving the hotel to a city in a different state.
 * A stateName without a cityName is rejected because the service needs both to find the new location.
 *
 * Valid same-state update: { cityName: "Pune" }.
 * Valid different-state update: { cityName: "Jaipur", stateName: "Rajasthan" }.
 * Invalid update: { stateName: "Rajasthan" } or an empty body {}.
 */
export const updateHotelSchema = createHotelSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "at least one field must be provided for an update",
    })
    .refine(
        (data) => data.stateName === undefined || data.cityName !== undefined,
        {
            message: "cityName is required when stateName is provided",
            path: ["stateName"],
        },
    );

// Validates the hotel UUID received in a route parameter.
export const hotelIdSchema = z.object({
    id: z.uuid("invalid hotel id"),
});
