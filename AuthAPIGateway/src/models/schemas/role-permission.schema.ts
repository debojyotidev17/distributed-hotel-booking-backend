import { pgTable, timestamp, uuid, unique } from "drizzle-orm/pg-core";

import { roles } from "./role.schema.js";
import { permissions } from "./permission.schema.js";

export const rolePermissions = pgTable(
    "role_permissions",
    {
        // Gives each role-permission assignment a generated UUID.
        id: uuid("id").defaultRandom().primaryKey(),

        // Identifies the role receiving the permission.
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),

        // Identifies the permission granted to the role.
        permissionId: uuid("permission_id")
            .notNull()
            .references(() => permissions.id, { onDelete: "cascade" }),

        // Records when the permission was assigned.
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

        // Update functions must refresh this when the assignment is modified.
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        // Prevents granting the same permission to a role twice.
        unique("role_permissions_role_id_permission_id_unique").on(
            table.roleId,
            table.permissionId,
        ),
    ],
);
