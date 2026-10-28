import { sql } from "drizzle-orm";
import {
    check,
    date,
    integer,
    pgTable,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

import { physicalRooms } from "./physical-room.schema.js";

export const rooms = pgTable(
    "room_availability",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        physicalRoomId: uuid("physical_room_id")
            .notNull()
            .references(() => physicalRooms.id, { onDelete: "cascade" }),

        dateOfAvailability: date("date_of_availability", {
            mode: "string",
        }).notNull(),

        price: integer("price").notNull(),

        bookingId: uuid("booking_id"),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        unique("rooms_physical_room_date_unique").on(
            table.physicalRoomId,
            table.dateOfAvailability,
        ),
        check("rooms_price_positive", sql`${table.price} > 0`),
    ],
);
