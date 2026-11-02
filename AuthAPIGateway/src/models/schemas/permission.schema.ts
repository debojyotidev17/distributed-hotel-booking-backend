import { pgTable, timestamp, uuid, varchar, text } from "drizzle-orm/pg-core";

// A hotel manager could receive hotel:create and hotel:update permissions
export const permissions = pgTable("permissions", {
    // Gives each permission a generated UUID.
    id: uuid("id").defaultRandom().primaryKey(),

    // Stores a readable permission name, such as hotel:create.
    name: varchar("name", { length: 100 }).notNull().unique(),

    // Explains what the permission allows.
    description: text("description"),

    // Identifies the resource the permission applies to.
    resource: varchar("resource", { length: 100 }).notNull(),

    // Identifies the action allowed on that resource.
    action: varchar("action", { length: 50 }).notNull(),

    // Records when the permission was created.
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

    // Update functions must refresh this when the permission is modified.
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
