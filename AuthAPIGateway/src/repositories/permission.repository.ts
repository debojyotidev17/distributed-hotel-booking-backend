import { and, eq } from "drizzle-orm";

import db from "../models/index.js";
import { permissions } from "../models/schemas/permission.schema.js";
import { userRoles } from "../models/schemas/user-role.schema.js";
import { rolePermissions } from "../models/schemas/role-permission.schema.js";

// Finds a permission using its ID.
export const findPermissionById = async (permissionId: string) => {
    const [permission] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.id, permissionId))
        .limit(1);

    return permission;
};

// Checks whether a user has a particular permission through their assigned roles.
export const userHasPermission = async (
    userId: string,
    permissionName: string,
) => {
    const [permission] = await db
        .select({
            permissionId: permissions.id,
        })
        .from(userRoles)
        .innerJoin(
            rolePermissions,
            eq(userRoles.roleId, rolePermissions.roleId),
        )
        .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id),
        )
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(permissions.name, permissionName),
            ),
        )
        .limit(1);

    return Boolean(permission);
};
