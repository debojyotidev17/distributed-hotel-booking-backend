import { and, eq, sql } from "drizzle-orm";
import db from "../models/index.js";
import { cities } from "../models/schemas/city.schema.js";
import type {
    CityIdDto,
    CreateCityDto,
    UpdateCityDto,
} from "../dtos/city.dto.js";

// Finds a city by its UUID.
export async function findCityById(id: CityIdDto) {
    const [city] = await db
        .select()
        .from(cities)
        .where(eq(cities.id, id))
        .limit(1);

    return city ?? null;
}

// Lists cities and optionally filters them by state.
export async function findAllCities(stateId?: string) {
    if (stateId) {
        return db.select().from(cities).where(eq(cities.stateId, stateId));
    }

    return db.select().from(cities);
}

// Finds a city by its name and state.
export async function findCityByNameAndState(name: string, stateId: string) {
    const [city] = await db
        .select()
        .from(cities)
        .where(
            and(
                sql`lower(${cities.name}) = lower(${name})`,
                eq(cities.stateId, stateId),
            ),
        )
        .limit(1);

    return city ?? null;
}

// Creates a city and returns the inserted database record.
export async function createCity(data: CreateCityDto) {
    const [city] = await db.insert(cities).values(data).returning();

    return city;
}

// Updates a city and returns null when it does not exist.
export async function updateCity(id: CityIdDto, data: UpdateCityDto) {
    const [city] = await db
        .update(cities)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(cities.id, id))
        .returning();

    return city ?? null;
}

// Deletes a city and returns null when it does not exist.
export async function deleteCity(id: CityIdDto) {
    const [city] = await db
        .delete(cities)
        .where(eq(cities.id, id))
        .returning({ id: cities.id });

    return city ?? null;
}
