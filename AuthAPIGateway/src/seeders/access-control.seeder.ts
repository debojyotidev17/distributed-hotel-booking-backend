import { eq } from "drizzle-orm";

import db from "../models/index.js";
import { roles } from "../models/schemas/role.schema.js";
import { permissions } from "../models/schemas/permission.schema.js";
import { rolePermissions } from "../models/schemas/role-permission.schema.js";

const defaultRoles = [
    {
        name: "customer",
        description: "Default role assigned to registered customers",
    },
    {
        name: "hotel_manager",
        description: "Manages hotel-related operations",
    },
    {
        name: "admin",
        description: "Has administrative access to the system",
    },
];

const defaultPermissions = [
    // Hotel management
    {
        name: "hotel:create",
        description: "Allows creating hotels",
        resource: "hotel",
        action: "create",
    },
    {
        name: "hotel:read",
        description: "Allows viewing hotels",
        resource: "hotel",
        action: "read",
    },
    {
        name: "hotel:update",
        description: "Allows updating hotels",
        resource: "hotel",
        action: "update",
    },
    {
        name: "hotel:delete",
        description: "Allows deleting hotels",
        resource: "hotel",
        action: "delete",
    },

    // Room and room-category management
    {
        name: "room:create",
        description: "Allows creating rooms and categories",
        resource: "room",
        action: "create",
    },
    {
        name: "room:read",
        description: "Allows viewing physical-room records",
        resource: "room",
        action: "read",
    },
    {
        name: "room:update",
        description: "Allows updating rooms and categories",
        resource: "room",
        action: "update",
    },
    {
        name: "room:delete",
        description: "Allows deleting rooms and categories",
        resource: "room",
        action: "delete",
    },

    // Availability management
    {
        name: "availability:create",
        description: "Allows creating availability periods",
        resource: "availability",
        action: "create",
    },

    // Booking permissions
    {
        name: "booking:create",
        description: "Allows creating bookings",
        resource: "booking",
        action: "create",
    },
    {
        name: "booking:read",
        description: "Allows viewing bookings",
        resource: "booking",
        action: "read",
    },
    {
        name: "booking:cancel",
        description: "Allows cancelling bookings",
        resource: "booking",
        action: "cancel",
    },
];

// These assignments define what each role is allowed to do.
const rolePermissionNames: Record<string, string[]> = {
    customer: ["booking:create", "booking:read", "booking:cancel"],
    hotel_manager: [
        "hotel:read",
        "hotel:update",
        "room:create",
        "room:read",
        "room:update",
        "room:delete",
        "availability:create",
        "booking:read",
    ],
    admin: defaultPermissions.map((permission) => permission.name),
};

const seedAccessControl = async () => {
    try {
        // Seed roles first because role-permission rows reference them.
        await db.insert(roles).values(defaultRoles).onConflictDoNothing();

        // Seed permissions before assigning them to roles.
        await db
            .insert(permissions)
            .values(defaultPermissions)
            .onConflictDoNothing();

        const savedRoles = await db.select().from(roles);
        const savedPermissions = await db.select().from(permissions);

        // Look up database IDs by their stable names.
        const roleIdByName = new Map(
            savedRoles.map((role) => [role.name, role.id]),
        );

        const permissionIdByName = new Map(
            savedPermissions.map((permission) => [
                permission.name,
                permission.id,
            ]),
        );

        const assignments = Object.entries(rolePermissionNames).flatMap(
            ([roleName, permissionNames]) => {
                const roleId = roleIdByName.get(roleName);

                if (!roleId) {
                    throw new Error(`Seeded role not found: ${roleName}`);
                }

                return permissionNames.map((permissionName) => {
                    const permissionId = permissionIdByName.get(permissionName);

                    if (!permissionId) {
                        throw new Error(
                            `Seeded permission not found: ${permissionName}`,
                        );
                    }

                    return { roleId, permissionId };
                });
            },
        );

        // The unique constraint makes rerunning this script safe.
        await db
            .insert(rolePermissions)
            .values(assignments)
            .onConflictDoNothing();

        console.log(
            "Roles, permissions, and role assignments seeded successfully.",
        );
    } catch (error) {
        console.error("Failed to seed access control:", error);
        process.exitCode = 1;
    } finally {
        await db.$client.end();
    }
};

await seedAccessControl();
