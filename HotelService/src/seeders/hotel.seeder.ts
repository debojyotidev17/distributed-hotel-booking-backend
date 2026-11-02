/**
 * It seeds 3 states, 5 cities, 5 hotels, 2 room categories per hotel, and 2 physical rooms per category. It uses the actual schema fields and unique constraints in your repository, and can be rerun without creating duplicates.  
 */


import { and, eq } from "drizzle-orm";

import db from "../models/index.js";
import { states } from "../models/schemas/state.schema.js";
import { cities } from "../models/schemas/city.schema.js";
import { hotels } from "../models/schemas/hotel.schema.js";
import { roomCategories } from "../models/schemas/room-category.schema.js";
import { physicalRooms } from "../models/schemas/physical-room.schema.js";
import { roomTypeValues } from "../constants/room-type.constant.js";

type RoomType = (typeof roomTypeValues)[number];

const stateSeeds = [
    { name: "Bihar", code: "BR", type: "STATE" as const },
    { name: "Maharashtra", code: "MH", type: "STATE" as const },
    { name: "Karnataka", code: "KA", type: "STATE" as const },
];

const citySeeds = [
    { name: "Patna", stateCode: "BR" },
    { name: "Gaya", stateCode: "BR" },
    { name: "Mumbai", stateCode: "MH" },
    { name: "Pune", stateCode: "MH" },
    { name: "Bengaluru", stateCode: "KA" },
];

const hotelSeeds: {
    name: string;
    address: string;
    cityName: string;
    categories: {
        roomType: RoomType;
        price: number;
        roomNumbers: string[];
    }[];
}[] = [
    {
        name: "Ganga View Hotel",
        address: "Fraser Road, Patna",
        cityName: "Patna",
        categories: [
            { roomType: "DOUBLE", price: 3500, roomNumbers: ["101", "102"] },
            { roomType: "DELUXE", price: 5500, roomNumbers: ["201", "202"] },
        ],
    },
    {
        name: "Bodh Heritage Hotel",
        address: "Bodh Gaya Road, Gaya",
        cityName: "Gaya",
        categories: [
            { roomType: "DOUBLE", price: 3000, roomNumbers: ["101", "102"] },
            { roomType: "SUITE", price: 6500, roomNumbers: ["301", "302"] },
        ],
    },
    {
        name: "Harbour View Residency",
        address: "Colaba, Mumbai",
        cityName: "Mumbai",
        categories: [
            { roomType: "DOUBLE", price: 6000, roomNumbers: ["101", "102"] },
            { roomType: "DELUXE", price: 9000, roomNumbers: ["201", "202"] },
        ],
    },
    {
        name: "Sahyadri Suites",
        address: "Koregaon Park, Pune",
        cityName: "Pune",
        categories: [
            { roomType: "DOUBLE", price: 4500, roomNumbers: ["101", "102"] },
            { roomType: "SUITE", price: 7500, roomNumbers: ["301", "302"] },
        ],
    },
    {
        name: "Garden City Hotel",
        address: "Indiranagar, Bengaluru",
        cityName: "Bengaluru",
        categories: [
            { roomType: "DOUBLE", price: 5000, roomNumbers: ["101", "102"] },
            { roomType: "DELUXE", price: 8000, roomNumbers: ["201", "202"] },
        ],
    },
];

async function seedHotelData() {
    await db.transaction(async (tx) => {
        // Insert states first because cities reference them.
        for (const stateSeed of stateSeeds) {
            await tx.insert(states).values(stateSeed).onConflictDoNothing();
        }

        // Insert cities and store their IDs for the hotel records.
        const cityIdByName = new Map<string, string>();

        for (const citySeed of citySeeds) {
            const [state] = await tx
                .select()
                .from(states)
                .where(eq(states.code, citySeed.stateCode))
                .limit(1);

            if (!state) {
                throw new Error(`State not found: ${citySeed.stateCode}`);
            }

            await tx
                .insert(cities)
                .values({
                    name: citySeed.name,
                    stateId: state.id,
                })
                .onConflictDoNothing();

            const [city] = await tx
                .select()
                .from(cities)
                .where(
                    and(
                        eq(cities.name, citySeed.name),
                        eq(cities.stateId, state.id),
                    ),
                )
                .limit(1);

            if (!city) {
                throw new Error(`City could not be seeded: ${citySeed.name}`);
            }

            cityIdByName.set(citySeed.name, city.id);
        }

        // Insert hotels, then their categories and physical rooms.
        for (const hotelSeed of hotelSeeds) {
            const cityId = cityIdByName.get(hotelSeed.cityName);

            if (!cityId) {
                throw new Error(`City not found: ${hotelSeed.cityName}`);
            }

            await tx
                .insert(hotels)
                .values({
                    name: hotelSeed.name,
                    address: hotelSeed.address,
                    cityId,
                })
                .onConflictDoNothing();

            const [hotel] = await tx
                .select()
                .from(hotels)
                .where(
                    and(
                        eq(hotels.name, hotelSeed.name),
                        eq(hotels.address, hotelSeed.address),
                        eq(hotels.cityId, cityId),
                    ),
                )
                .limit(1);

            if (!hotel) {
                throw new Error(`Hotel could not be seeded: ${hotelSeed.name}`);
            }

            for (const categorySeed of hotelSeed.categories) {
                await tx
                    .insert(roomCategories)
                    .values({
                        hotelId: hotel.id,
                        roomType: categorySeed.roomType,
                        price: categorySeed.price,
                    })
                    .onConflictDoNothing();

                const [category] = await tx
                    .select()
                    .from(roomCategories)
                    .where(
                        and(
                            eq(roomCategories.hotelId, hotel.id),
                            eq(roomCategories.roomType, categorySeed.roomType),
                        ),
                    )
                    .limit(1);

                if (!category) {
                    throw new Error(
                        `Category could not be seeded: ${categorySeed.roomType}`,
                    );
                }

                // Add only rooms that do not already exist in this category.
                for (const roomNumber of categorySeed.roomNumbers) {
                    const [existingRoom] = await tx
                        .select()
                        .from(physicalRooms)
                        .where(
                            and(
                                eq(physicalRooms.roomCategoryId, category.id),
                                eq(physicalRooms.roomNumber, roomNumber),
                            ),
                        )
                        .limit(1);

                    if (!existingRoom) {
                        await tx
                            .insert(physicalRooms)
                            .values({
                                roomCategoryId: category.id,
                                roomNumber,
                            })
                            .onConflictDoNothing();
                    }
                }
            }
        }
    });

    console.log("HotelService seed data inserted successfully.");
}

try {
    await seedHotelData();
} catch (error) {
    console.error("Failed to seed HotelService:", error);
    process.exitCode = 1;
} finally {
    await db.$client.end();
}
