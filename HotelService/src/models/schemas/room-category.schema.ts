import { sql } from "drizzle-orm";
import {
    check,
    integer,
    pgEnum,
    pgTable,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

import { hotels } from "./hotel.schema.js";
import { roomTypeValues } from "../../constants/room-type.constant.js";

export const roomTypeEnum = pgEnum("room_type", roomTypeValues);

export const roomCategories = pgTable(
    "room_categories",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        hotelId: uuid("hotel_id")
            .notNull()
            .references(() => hotels.id, { onDelete: "cascade" }),

        roomType: roomTypeEnum("room_type").notNull(),

        price: integer("price").notNull(),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        unique("room_categories_hotel_id_room_type_unique").on(
            table.hotelId,
            table.roomType,
        ),
        check("room_categories_price_positive", sql`${table.price} > 0`),
    ],
);