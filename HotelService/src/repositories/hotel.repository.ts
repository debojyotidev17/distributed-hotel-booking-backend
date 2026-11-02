import { eq } from "drizzle-orm";

import db from "../models/index.js";
import { hotels } from "../models/schemas/hotel.schema.js";

import type {
    CreateHotelRecordDto,
    HotelIdDto,
    UpdateHotelRecordDto,
} from "../dtos/hotel.dto.js";

// finds a hotel by id
export async function findHotelById(id: HotelIdDto) {
    const [hotel] = await db
        .select()
        .from(hotels)
        .where(eq(hotels.id, id))
        .limit(1);

    return hotel ?? null;
}

// gets all hotels
export async function findAllHotels() {
    return await db.select().from(hotels);
}

// creates a hotel record
export async function createHotel(hotelData: CreateHotelRecordDto) {
    const [hotel] = await db.insert(hotels).values(hotelData).returning();

    return hotel;
}

// updates a hotel and returns null when it does not exist
export async function updateHotel(
    id: HotelIdDto,
    hotelData: UpdateHotelRecordDto,
) {
    const [hotel] = await db
        .update(hotels)
        .set({ ...hotelData, updatedAt: new Date() })
        .where(eq(hotels.id, id))
        .returning();

    return hotel ?? null;
}

// deletes a hotel
export async function deleteHotel(id: HotelIdDto) {
    const [hotel] = await db
        .delete(hotels)
        .where(eq(hotels.id, id))
        .returning({ id: hotels.id });

    return hotel ?? null;
}
