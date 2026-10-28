import { and, eq, sql } from "drizzle-orm";
import db from "../models/index.js";
import { states } from "../models/schemas/state.schema.js";
import type {
    CreateStateDto,
    StateIdDto,
    UpdateStateDto,
} from "../dtos/state.dto.js";

// finds a state or union territory by id
export async function findStateById(id: StateIdDto) {
    const [state] = await db
        .select()
        .from(states)
        .where(eq(states.id, id))
        .limit(1);

    return state ?? null;
}

// gets all states and union territories
export async function findAllStates() {
    return db.select().from(states);
}

// finds a state or union territory by name
export async function findStateByName(name: string) {
    const [state] = await db
        .select()
        .from(states)
        .where(and(sql`lower(${states.name}) = lower(${name})`))
        .limit(1);

    return state ?? null;
}

// finds a state or union territory by code
export async function findStateByCode(code: string) {
    const [state] = await db
        .select()
        .from(states)
        .where(eq(states.code, code))
        .limit(1);

    return state ?? null;
}

// creates a state or union territory
export async function createState(data: CreateStateDto) {
    const [state] = await db.insert(states).values(data).returning();

    return state;
}

// updates a state or union territory
export async function updateState(id: StateIdDto, data: UpdateStateDto) {
    const [state] = await db
        .update(states)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(states.id, id))
        .returning();

    return state ?? null;
}

// permanently deletes a state and returns null if it does not exist.
export async function deleteState(id: StateIdDto) {
    const [state] = await db
        .delete(states)
        .where(eq(states.id, id))
        .returning({ id: states.id });

    return state ?? null;
}