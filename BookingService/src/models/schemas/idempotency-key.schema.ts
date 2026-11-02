import { pgEnum, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { bookings } from "./booking.schema.js";

// Tracks whether the key can still confirm its booking.
export const idempotencyKeyStatusValues = [
    "ACTIVE",
    "FINALIZED",
    "EXPIRED",
] as const;

export const idempotencyKeyStatusEnum = pgEnum(
    "idempotency_key_status",
    idempotencyKeyStatusValues,
);

export const idempotencyKeys = pgTable(
    "idempotency_keys",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        // A key must not be shared by different requests/bookings.
        idempotencyKey: uuid("idempotency_key").notNull(),

        // The unique constraint below makes this a one-key-per-booking relationship.
        bookingId: uuid("booking_id")
            .notNull()
            .references(() => bookings.id, { onDelete: "cascade" }),

        // ACTIVE can confirm; FINALIZED was already used; EXPIRED timed out.
        status: idempotencyKeyStatusEnum("status").notNull().default("ACTIVE"),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        unique("idempotency_keys_key_unique").on(table.idempotencyKey),
        unique("idempotency_keys_booking_id_unique").on(table.bookingId),
    ],
);
