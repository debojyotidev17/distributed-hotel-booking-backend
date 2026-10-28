import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { roomCategories } from "./room-category.schema.js";

export const physicalRooms = pgTable(
    "physical_rooms",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        roomCategoryId: uuid("room_category_id")
            .notNull()
            .references(() => roomCategories.id, { onDelete: "cascade" }),

        roomNumber: varchar("room_number", { length: 20 }).notNull(),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        unique("physical_rooms_category_number_unique").on(
            table.roomCategoryId,
            table.roomNumber,
        ),
    ],
);
