import { eq, and } from "drizzle-orm";

import db from "../models/index.js";
import { rolePermissions } from "../models/schemas/role-permission.schema.js";

// Fetches all permissions assigned to a particular role.
export const findRolePermissionsByRoleId = async (roleId: string) => {
    return await db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
};

// Assigns a permission to a role.
export const assignPermissionToRole = async (
    roleId: string,
    permissionId: string,
) => {
    const [assignment] = await db
        .insert(rolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing({
            target: [rolePermissions.roleId, rolePermissions.permissionId],
        })
        .returning();

    return assignment;
};

// Removes a permission from a role.
export const removePermissionFromRole = async (
    roleId: string,
    permissionId: string,
) => {
    const [deletedAssignment] = await db
        .delete(rolePermissions)
        .where(
            and(
                eq(rolePermissions.roleId, roleId),
                eq(rolePermissions.permissionId, permissionId),
            ),
        )
        .returning();

    return deletedAssignment;
};

// Fetches all role-permission assignments.
export const findAllRolePermissions = async () => {
    return await db.select().from(rolePermissions);
};