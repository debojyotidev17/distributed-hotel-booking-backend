import {
    integer,
    pgTable,
    real,
    text,
    timestamp,
    unique,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { cities } from "./city.schema.js";

export const hotels = pgTable(
    "hotels",
    {
        // Gives each hotel a generated UUID.
        id: uuid("id").defaultRandom().primaryKey(),

        // Stores the hotel's name, limited to 100 characters.
        name: varchar("name", { length: 100 }).notNull(),

        // Stores the hotel's complete address.
        address: text("address").notNull(),

        // Links the hotel to a city; deleting the city also deletes its hotels.
        cityId: uuid("city_id")
            .notNull()
            .references(() => cities.id, { onDelete: "cascade" }),

        // Stores the average rating and defaults to 0 before the hotel receives reviews.
        rating: real("rating").default(0).notNull(),

        // Stores the number of ratings and defaults to 0 before the hotel receives reviews.
        ratingCount: integer("rating_count").default(0).notNull(),

        // Records when the hotel was created.
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

        // Records the latest update; update functions must refresh it.
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        // Prevents the same hotel name and address from being added twice in one city.
        unique("hotels_city_name_address_unique").on(
            table.cityId,
            table.name,
            table.address,
        ),
    ],
);