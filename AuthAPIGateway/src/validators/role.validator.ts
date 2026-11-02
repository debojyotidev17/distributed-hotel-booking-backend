import { z } from "zod";

// Validates the user and role IDs received through route parameters.
export const assignRoleParamsSchema = z.object({
    userId: z.uuid(),
    roleId: z.uuid(),
});

// Validates the data required to create a role.
export const createRoleSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().min(5).max(200),
});

// Validates the data required to update a role.
export const updateRoleSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().min(5).max(200),
});

// Validates the role ID received through route parameters.
export const roleIdParamsSchema = z.object({
    id: z.uuid(),
});