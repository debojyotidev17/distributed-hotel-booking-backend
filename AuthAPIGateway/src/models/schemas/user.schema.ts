import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    // Gives each user a generated UUID.
    id: uuid("id").defaultRandom().primaryKey(),

    // Stores the username chosen during signup.
    username: varchar("username", { length: 50 }).notNull(),

    // Stores the user's email address.
    email: varchar("email", { length: 255 }).notNull().unique(),

    // Stores the hashed password, never the plain-text password.
    password: varchar("password", { length: 255 }).notNull(),

    // Records when the user was created.
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

    // Update functions must refresh this when the user is modified.
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});