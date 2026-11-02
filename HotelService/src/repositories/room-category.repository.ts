import { and, eq } from "drizzle-orm";

import db from "../models/index.js";
import { roomCategories } from "../models/schemas/room-category.schema.js";
import type {
    CreateRoomCategoryDto,
    RoomCategoryHotelIdDto,
    RoomCategoryParamsDto,
    UpdateRoomCategoryDto,
} from "../dtos/room-category.dto.js";

// Finds a category only when it belongs to the hotel in the route.
// returns null if the category exists under a different hotel
export async function findRoomCategoryById(params: RoomCategoryParamsDto) {
    const [category] = await db
        .select()
        .from(roomCategories)
        .where(
            and(
                eq(roomCategories.hotelId, params.hotelId),
                eq(roomCategories.id, params.roomCategoryId),
            ),
        )
        .limit(1);

    return category ?? null;
}

// Gets all room categories belonging to one hotel.
export async function findRoomCategoriesByHotelId(
    hotelId: RoomCategoryHotelIdDto,
) {
    return db
        .select()
        .from(roomCategories)
        .where(eq(roomCategories.hotelId, hotelId));
}

// Finds a room type within one hotel to check for duplicates.
export async function findRoomCategoryByType(
    hotelId: RoomCategoryHotelIdDto,
    roomType: CreateRoomCategoryDto["roomType"],
) {
    const [category] = await db
        .select()
        .from(roomCategories)
        .where(
            and(
                eq(roomCategories.hotelId, hotelId),
                eq(roomCategories.roomType, roomType),
            ),
        )
        .limit(1);

    return category ?? null;
}

// Creates a category under the hotel specified in the route.
export async function createRoomCategory(
    hotelId: RoomCategoryHotelIdDto,
    data: CreateRoomCategoryDto,
) {
    const [category] = await db
        .insert(roomCategories)
        .values({
            ...data,
            hotelId,
        })
        .returning();

    return category;
}

// Updates a category only when it belongs to the hotel in the route.
export async function updateRoomCategory(
    params: RoomCategoryParamsDto,
    data: UpdateRoomCategoryDto,
) {
    const [category] = await db
        .update(roomCategories)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(roomCategories.hotelId, params.hotelId),
                eq(roomCategories.id, params.roomCategoryId),
            ),
        )
        .returning();

    return category ?? null;
}

// Permanently deletes a category only when it belongs to the hotel in the route.
export async function deleteRoomCategory(params: RoomCategoryParamsDto) {
    const [category] = await db
        .delete(roomCategories)
        .where(
            and(
                eq(roomCategories.hotelId, params.hotelId),
                eq(roomCategories.id, params.roomCategoryId),
            ),
        )
        .returning({ id: roomCategories.id });

    return category ?? null;
}

// Finds a category by ID when the worker has no hotel ID.
export async function findRoomCategoryByIdOnly(id: string) {
    const [category] = await db
        .select()
        .from(roomCategories)
        .where(eq(roomCategories.id, id))
        .limit(1);

    return category ?? null;
}