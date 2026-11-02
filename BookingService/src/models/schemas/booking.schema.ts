import { sql } from "drizzle-orm";
import {
    check,
    date,
    integer,
    pgEnum,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

// A booking starts pending while its room hold is active.
export const bookingStatusValues = [
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
] as const;

export const bookingStatusEnum = pgEnum("booking_status", bookingStatusValues);

export const bookings = pgTable(
    "bookings",
    {
        // Generate this ID before calling HotelService so it can mark the room rows with it.
        id: uuid("id").defaultRandom().primaryKey(),

        // These IDs belong to HotelService, so this service stores them without cross-service foreign keys.
        hotelId: uuid("hotel_id").notNull(),
        roomCategoryId: uuid("room_category_id").notNull(),

        // Email address used for booking notifications.
        customerEmail: varchar("customer_email", { length: 255 }).notNull(),

        checkIn: date("check_in", { mode: "string" }).notNull(),

        // The check-out date is excluded from the stay.
        checkOut: date("check_out", { mode: "string" }).notNull(),

        // The number of rooms requested by the customer.
        roomCount: integer("room_count").notNull(),

        // Calculated from the prices returned by HotelService; never accept this from the client.
        bookingAmount: integer("booking_amount").notNull(),

        status: bookingStatusEnum("status").notNull().default("PENDING"),

        // Set to 10 minutes after HotelService successfully holds the rooms.
        holdExpiresAt: timestamp("hold_expires_at", {
            withTimezone: true,
        }).notNull(),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        // Check-in must be before check-out.
        check("bookings_valid_stay", sql`${table.checkIn} < ${table.checkOut}`),

        // A customer must request at least one room.
        check("bookings_positive_room_count", sql`${table.roomCount} > 0`),

        // The calculated booking amount must be positive.
        check("bookings_positive_amount", sql`${table.bookingAmount} > 0`),
    ],
);
