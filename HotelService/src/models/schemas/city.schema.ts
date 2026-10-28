import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { states } from "./state.schema.js";

export const cities = pgTable(
    "cities",
    {
        // Uniquely identifies each city and automatically generates its UUID.
        id: uuid("id").defaultRandom().primaryKey(),

        // Stores the city's name.
        name: varchar("name", { length: 100 }).notNull(),

        // Links the city to its state; permanently deleting the state also deletes its cities.
        stateId: uuid("state_id")
            .notNull()
            .references(() => states.id, { onDelete: "cascade" }),

        // Records when the city was created.
        createdAt: timestamp("created_at").defaultNow().notNull(),

        // Records the most recent update; update operations must refresh it.
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        // Allows the same city name in different states but not twice in one state.
        unique("cities_name_state_id_unique").on(table.name, table.stateId),
    ],
);
