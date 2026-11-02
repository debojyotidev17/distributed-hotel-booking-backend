import { eq } from "drizzle-orm";

import db from "../models/index.js";
import { roles } from "../models/schemas/role.schema.js";

import type { CreateRoleDto, UpdateRoleDto } from "../dtos/role.dto.js";

// Finds a role using its ID.
export const findRoleById = async (roleId: string) => {
    const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

    return role;
};

// Finds a role using its name.
export const findRoleByName = async (name: string) => {
    const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);

    return role;
};

// Fetches all available roles.
export const findAllRoles = async () => {
    return await db.select().from(roles);
};

// Creates a new role.
export const createRole = async (roleData: CreateRoleDto) => {
    const [role] = await db.insert(roles).values(roleData).returning();

    return role;
};

// Updates an existing role.
export const updateRole = async (roleId: string, roleData: UpdateRoleDto) => {
    const [role] = await db
        .update(roles)
        .set({
            ...roleData,
            updatedAt: new Date(),
        })
        .where(eq(roles.id, roleId))
        .returning();

    return role;
};

// Deletes a role using its ID.
export const deleteRole = async (roleId: string) => {
    const [deletedRole] = await db
        .delete(roles)
        .where(eq(roles.id, roleId))
        .returning({ id: roles.id });

    return deletedRole;
};

