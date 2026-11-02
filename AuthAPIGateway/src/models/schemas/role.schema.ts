import { pgTable, timestamp, uuid, varchar, text } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
    // Gives each role a generated UUID.
    id: uuid("id").defaultRandom().primaryKey(),

    // Stores the role name, such as admin or customer.
    name: varchar("name", { length: 100 }).notNull().unique(),

    // Explains what the role is allowed to do.
    description: text("description"),

    // Records when the role was created.
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

    // Update functions must refresh this when the role is modified.
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});