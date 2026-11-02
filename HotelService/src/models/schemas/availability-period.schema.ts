import { sql } from "drizzle-orm";
import {
    check,
    date,
    integer,
    pgTable,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { roomCategories } from "./room-category.schema.js";

export const availabilityPeriods = pgTable(
    "availability_periods",
    {
        // Gives each availability rule a generated UUID.
        id: uuid("id").defaultRandom().primaryKey(),

        // Links the rule to a room category; deleting the category deletes its rules.
        roomCategoryId: uuid("room_category_id")
            .notNull()
            .references(() => roomCategories.id, { onDelete: "cascade" }),

        // [startDate, endDate)
        startDate: date("start_date", { mode: "string" }).notNull(),
        endDate: date("end_date", { mode: "string" }).notNull(),

        // Sets how many rooms the owner wants offered on each included night.
        roomsPerNight: integer("rooms_per_night").notNull(),

        // Records when this rule was created.
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

        // Records the latest update; update functions must refresh it.
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        // Requires the end date to be after the start date.
        check(
            "availability_periods_valid_range",
            sql`${table.startDate} < ${table.endDate}`,
        ),

        // Requires at least one room to be offered per night.
        check(
            "availability_periods_positive_room_count",
            sql`${table.roomsPerNight} > 0`,
        ),
    ],
);
