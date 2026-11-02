import { pgTable, timestamp, uuid, unique } from "drizzle-orm/pg-core";

import { users } from "./user.schema.js";
import { roles } from "./role.schema.js";

export const userRoles = pgTable(
    "user_roles",
    {
        // Gives each user-role assignment a generated UUID.
        id: uuid("id").defaultRandom().primaryKey(),

        // Identifies the user receiving the role.
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        // Identifies the role assigned to the user.
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),

        // Records when the role was assigned.
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

        // Update functions must refresh this when the assignment is modified.
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        // Prevents assigning the same role to the same user twice.
        unique("user_roles_user_id_role_id_unique").on(
            table.userId,
            table.roleId,
        ),
    ],
);
