import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const stateTypeEnum = pgEnum("state_type", ["STATE", "UNION_TERRITORY"]);

export const states = pgTable("states", {
    // Uniquely identifies each Indian state or union territory.
    id: uuid("id").defaultRandom().primaryKey(),

    // Stores the unique official name of the state or union territory.
    name: varchar("name", { length: 100 }).notNull().unique(),

    // Stores a unique short code for the state or union territory.
    code: varchar("code", { length: 3 }).notNull().unique(),

    // Distinguishes a state from a union territory.
    type: stateTypeEnum("type").notNull(),

    // Records when the state record was created.
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Records the most recent update; update operations must refresh it.
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});