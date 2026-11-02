import { and, eq, inArray } from "drizzle-orm";

import db from "../models/index.js";
import { userRoles } from "../models/schemas/user-role.schema.js";
import { roles } from "../models/schemas/role.schema.js";

// Checks whether a user has at least one of the specified roles.
export const userHasAnyRole = async (userId: string, roleNames: string[]) => {
    if (roleNames.length === 0) {
        return true;
    }

    const [userRole] = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
            and(eq(userRoles.userId, userId), inArray(roles.name, roleNames)),
        )
        .limit(1);

    return Boolean(userRole);
};

// Checks whether a user has all the specified roles.
export const userHasAllRoles = async (userId: string, roleNames: string[]) => {
    if (roleNames.length === 0) {
        return true;
    }

    const userRoleRecords = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
            and(eq(userRoles.userId, userId), inArray(roles.name, roleNames)),
        );

    const assignedRoles = new Set(
        userRoleRecords.map((record) => record.roleName),
    );

    return (
        new Set(roleNames).size ===
        [...new Set(roleNames)].filter((role) => assignedRoles.has(role)).length
    );
};


// Assigns a role to a user.
export const assignRoleToUser = async (userId: string, roleId: string) => {
    const [assignment] = await db
        .insert(userRoles)
        .values({ userId, roleId })
        // This prevents duplicate user-role assignments at the database level.
        .onConflictDoNothing({
            target: [userRoles.userId, userRoles.roleId],
        })
        .returning();

    return assignment;
};